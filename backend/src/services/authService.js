import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query, withTransaction } from '../db.js';
import { nowIso } from '../utils/helpers.js';

function safeAdmin(row) {
  if (!row) return null;
  const { password_hash: _password, ...safe } = row;
  if (safe.created_at instanceof Date) safe.created_at = safe.created_at.toISOString();
  if (safe.updated_at instanceof Date) safe.updated_at = safe.updated_at.toISOString();
  if (safe.last_login_at instanceof Date) safe.last_login_at = safe.last_login_at.toISOString();
  return safe;
}

export async function findAdminByEmail(email) {
  const result = await query(
    `SELECT * FROM admins
     WHERE active = TRUE AND email = $1
     LIMIT 1`,
    [String(email).toLowerCase()]
  );
  return result.rows[0] || null;
}

export async function findAdminById(id) {
  const result = await query(
    `SELECT * FROM admins
     WHERE active = TRUE AND id = $1
     LIMIT 1`,
    [Number(id)]
  );
  return safeAdmin(result.rows[0]);
}

export async function authenticateAdmin(email, password) {
  const admin = await findAdminByEmail(email);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) return null;
  const now = nowIso();
  await query(
    `UPDATE admins
     SET last_login_at = $2, updated_at = $2
     WHERE id = $1`,
    [admin.id, now]
  );
  return { ...admin, last_login_at: now, updated_at: now };
}

export function createAuthToken(admin) {
  const csrf = crypto.randomBytes(24).toString('hex');
  const token = jwt.sign(
    {
      sub: String(admin.id),
      email: admin.email,
      name: admin.display_name,
      role: admin.role,
      ver: Number(admin.auth_version || 1),
      csrf
    },
    config.auth.jwtSecret,
    {
      expiresIn: `${config.auth.tokenHours}h`,
      issuer: 'mama-time-api',
      audience: 'mama-time-admin'
    }
  );
  return { token, csrf };
}

export function verifyAuthToken(token) {
  return jwt.verify(token, config.auth.jwtSecret, {
    issuer: 'mama-time-api',
    audience: 'mama-time-admin'
  });
}

export function setAuthCookie(res, token) {
  res.cookie(config.auth.cookieName, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: config.auth.tokenHours * 60 * 60 * 1000
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(config.auth.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/'
  });
}

export async function isDefaultPasswordActive(adminId) {
  if (!config.auth.showDefaultPasswordWarning) return false;
  const result = await query(
    'SELECT password_hash FROM admins WHERE active = TRUE AND id = $1 LIMIT 1',
    [Number(adminId)]
  );
  const admin = result.rows[0];
  return Boolean(admin && bcrypt.compareSync('ChangeMe-Now-2026!', admin.password_hash));
}

export async function changePassword(adminId, currentPassword, newPassword) {
  return withTransaction(async (client) => {
    const result = await client.query(
      'SELECT * FROM admins WHERE active = TRUE AND id = $1 FOR UPDATE',
      [Number(adminId)]
    );
    const admin = result.rows[0];
    if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) return false;
    await client.query(
      `UPDATE admins
       SET password_hash = $2,
           auth_version = auth_version + 1,
           updated_at = $3
       WHERE id = $1`,
      [Number(adminId), bcrypt.hashSync(newPassword, 12), nowIso()]
    );
    return true;
  });
}

export async function upsertAdmin({ email, password, displayName = 'Sentinators Admin' }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const now = nowIso();
  const passwordHash = bcrypt.hashSync(password, 12);
  const result = await query(
    `INSERT INTO admins (
       email, password_hash, display_name, role, active, auth_version,
       created_at, updated_at, last_login_at
     ) VALUES ($1, $2, $3, 'admin', TRUE, 1, $4, $4, NULL)
     ON CONFLICT (email)
     DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       display_name = EXCLUDED.display_name,
       active = TRUE,
       auth_version = admins.auth_version + 1,
       updated_at = EXCLUDED.updated_at
     RETURNING id, email, display_name, role, active, auth_version, created_at, updated_at, last_login_at`,
    [normalizedEmail, passwordHash, displayName, now]
  );
  return safeAdmin(result.rows[0]);
}
