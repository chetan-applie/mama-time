import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const problems = [];
const warnings = [];
const notes = [];
let productionMode = false;
let env = {};

const nodeVersion = process.versions.node.split('.').map(Number);
const supported = nodeVersion[0] > 22
  || (nodeVersion[0] === 22 && nodeVersion[1] >= 12)
  || (nodeVersion[0] === 20 && nodeVersion[1] >= 19);
if (!supported) problems.push(`Node.js ${process.versions.node} is not supported. Use Node 20.19+ or Node 22.12+.`);
else notes.push(`Node.js ${process.versions.node}: OK`);

const envPath = path.join(root, '.env');
if (!fs.existsSync(envPath)) {
  warnings.push('No .env file found. Run `npm run setup` before starting the application.');
} else {
  env = Object.fromEntries(fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return index >= 0 ? [line.slice(0, index), line.slice(index + 1)] : [line, ''];
    }));
  if (!env.JWT_SECRET || env.JWT_SECRET.includes('replace-with') || env.JWT_SECRET.length < 40) {
    problems.push('JWT_SECRET is missing or too short.');
  }
  if (!env.IP_HASH_SECRET || env.IP_HASH_SECRET.includes('replace-with') || env.IP_HASH_SECRET.length < 40) {
    problems.push('IP_HASH_SECRET is missing or too short.');
  }
  if (!env.ADMIN_BOOTSTRAP_PASSWORD || env.ADMIN_BOOTSTRAP_PASSWORD === 'ChangeMe-Now-2026!') {
    problems.push('The bootstrap admin password is still the documented default.');
  }
  if (!/^postgres(?:ql)?:\/\//i.test(env.DATABASE_URL || '')) {
    problems.push('DATABASE_URL is missing or is not a PostgreSQL URL.');
  }
  productionMode = env.NODE_ENV === 'production';
  if (productionMode && !String(env.APP_BASE_URL || '').startsWith('https://')) {
    problems.push('Production APP_BASE_URL must start with https://.');
  }
  if (productionMode && /mama_time_dev_password|ChangeMe-Now-2026/i.test(`${env.DATABASE_URL} ${env.POSTGRES_PASSWORD}`)) {
    problems.push('Production database credentials still contain documented development values.');
  }
  if (!env.WHATSAPP_NUMBER) warnings.push('WHATSAPP_NUMBER is empty; WhatsApp buttons will fall back to the lead form.');
  if (!env.NOTIFICATION_EMAIL) warnings.push('NOTIFICATION_EMAIL is empty; leads will still be stored in PostgreSQL, but no email notification will be sent.');
  const metaEnabled = ['true', '1', 'yes', 'on'].includes(String(env.META_PIXEL_ENABLED || '').toLowerCase());
  if (metaEnabled && !/^\d{5,30}$/.test(String(env.META_PIXEL_ID || '').trim())) {
    problems.push('META_PIXEL_ID must contain 5 to 30 digits when META_PIXEL_ENABLED=true.');
  }
  notes.push(`Environment file: ${env.NODE_ENV || 'not set'}`);
}

const legalPath = path.join(root, 'frontend', 'src', 'pages', 'LegalPage.jsx');
if (fs.existsSync(legalPath)) {
  const legalSource = fs.readFileSync(legalPath, 'utf8');
  const containsPlaceholder = /\[(?:Vollständige|Rechtlicher|Strasse|PLZ|ergänzen|Name und Funktion|Nur soweit)/.test(legalSource);
  if (containsPlaceholder) {
    const message = 'LegalPage.jsx still contains imprint/privacy placeholders.';
    if (productionMode) problems.push(message); else warnings.push(message);
  }
  const requiredLegalValues = ['Sentinator GmbH', 'Hauptstrasse 11', '9476 Weite', 'info@sentinator.li'];
  const missingLegalValues = requiredLegalValues.filter((value) => !legalSource.includes(value));
  if (missingLegalValues.length) {
    const message = `LegalPage.jsx is missing operator values: ${missingLegalValues.join(', ')}`;
    if (productionMode) problems.push(message); else warnings.push(message);
  } else {
    notes.push('Imprint/privacy operator details: OK');
  }
}

const pixelPath = path.join(root, 'frontend', 'src', 'lib', 'metaPixel.js');
if (!fs.existsSync(pixelPath)) {
  problems.push('Consent-controlled Meta Pixel adapter is missing.');
} else {
  const pixelSource = fs.readFileSync(pixelPath, 'utf8');
  const requiredPixelMarkers = [
    'mama_time_marketing_consent_v1',
    "window.fbq('track', 'PageView')",
    "window.fbq('track', 'ViewContent'",
    "window.fbq('consent', 'revoke')",
    'safeMetaParameters'
  ];
  const missingMarkers = requiredPixelMarkers.filter((value) => !pixelSource.includes(value));
  if (missingMarkers.length) problems.push(`Meta Pixel adapter is incomplete: ${missingMarkers.join(', ')}`);
  else notes.push('Consent-controlled Meta Pixel adapter: OK');
}

const distPath = path.join(root, 'frontend', 'dist', 'index.html');
if (!fs.existsSync(distPath)) warnings.push('Frontend build not found. Run `npm run build`.');
else notes.push('React production build: OK');

const migrationDir = path.join(root, 'backend', 'migrations');
const migrationFiles = fs.existsSync(migrationDir)
  ? fs.readdirSync(migrationDir).filter((name) => /^\d+.*\.sql$/i.test(name)).sort()
  : [];
if (!migrationFiles.length) problems.push('No SQL migration files were found in backend/migrations.');
else notes.push(`${migrationFiles.length} SQL migration files found.`);

if (env.DATABASE_URL && /^postgres(?:ql)?:\/\//i.test(env.DATABASE_URL)) {
  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: Number(env.DATABASE_CONNECTION_TIMEOUT_MS || 10000),
    ssl: ['true', '1', 'yes', 'on'].includes(String(env.DATABASE_SSL || '').toLowerCase())
      ? { rejectUnauthorized: !['false', '0', 'no', 'off'].includes(String(env.DATABASE_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase()) }
      : undefined
  });
  try {
    const version = await pool.query('SELECT version() AS version, current_database() AS name');
    notes.push(`PostgreSQL connection: OK (${version.rows[0].name})`);
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('admins', 'app_settings', 'leads', 'lead_activities', 'schema_migrations')
    `);
    const tableNames = new Set(tables.rows.map((row) => row.table_name));
    const missing = ['admins', 'app_settings', 'leads', 'lead_activities', 'schema_migrations']
      .filter((name) => !tableNames.has(name));
    if (missing.length) warnings.push(`Database schema is incomplete (${missing.join(', ')}). Run \`npm run db:migrate\`.`);
    else notes.push('Required PostgreSQL tables: OK');

    if (!missing.includes('schema_migrations')) {
      const applied = await pool.query('SELECT name FROM schema_migrations ORDER BY name');
      const appliedNames = new Set(applied.rows.map((row) => row.name));
      const pending = migrationFiles.filter((name) => !appliedNames.has(name));
      if (pending.length) warnings.push(`Pending database migrations: ${pending.join(', ')}`);
      else notes.push('Database migrations: up to date');
    }
  } catch (error) {
    problems.push(`PostgreSQL connection failed: ${error.message}`);
  } finally {
    await pool.end().catch(() => {});
  }
}

console.log('\nMAMA TIME SYSTEM CHECK\n======================');
for (const note of notes) console.log(`✓ ${note}`);
for (const warning of warnings) console.log(`! ${warning}`);
for (const problem of problems) console.log(`✗ ${problem}`);
console.log('');
if (problems.length) process.exit(1);
console.log(warnings.length ? 'System check passed with warnings.' : 'System check passed.');
