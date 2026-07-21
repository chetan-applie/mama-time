import { config } from '../config.js';
import { findAdminById, verifyAuthToken } from '../services/authService.js';
import { asyncHandler, timingSafeEqualString } from '../utils/helpers.js';

export const requireAdmin = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.[config.auth.cookieName];
    if (!token) return res.status(401).json({ ok: false, message: 'Nicht angemeldet.' });
    const payload = verifyAuthToken(token);
    const admin = await findAdminById(Number(payload.sub));
    if (!admin || Number(payload.ver || 1) !== Number(admin.auth_version || 1)) {
      return res.status(401).json({ ok: false, message: 'Sitzung ungültig.' });
    }
    req.admin = admin;
    req.authPayload = payload;
    next();
  } catch {
    return res.status(401).json({ ok: false, message: 'Sitzung abgelaufen.' });
  }
});

export function requireCsrf(req, res, next) {
  const header = req.get('X-CSRF-Token') || '';
  const expected = req.authPayload?.csrf || '';
  if (!header || !expected || !timingSafeEqualString(header, expected)) {
    return res.status(403).json({ ok: false, message: 'Ungültiger Sicherheitstoken. Bitte lade die Seite neu.' });
  }
  next();
}
