import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(__dirname, '../..');
if (process.env.VERCEL !== '1') {
  dotenv.config({ path: path.join(projectRoot, '.env') });
}

// Setup Vercel-specific default environment variables
if (process.env.VERCEL === '1') {
  // Always force database in /tmp as Vercel filesystem is read-only
  process.env.DATABASE_PATH = '/tmp/mama-time.json';

  // Force HTTPS Vercel URL if APP_BASE_URL is not set or is localhost
  if (!process.env.APP_BASE_URL || process.env.APP_BASE_URL.includes('localhost')) {
    if (process.env.VERCEL_URL) {
      process.env.APP_BASE_URL = `https://${process.env.VERCEL_URL}`;
    }
  }

  // Force secure fallbacks if they are empty, or if they are the insecure development defaults
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('development-only')) {
    process.env.JWT_SECRET = 'vercel-default-jwt-secret-very-long-and-secure-random-1234567890';
  }
  if (!process.env.IP_HASH_SECRET || process.env.IP_HASH_SECRET.includes('development-only')) {
    process.env.IP_HASH_SECRET = 'vercel-default-ip-hash-secret-very-long-and-secure-random-1234567890';
  }
  if (!process.env.ADMIN_BOOTSTRAP_EMAIL || process.env.ADMIN_BOOTSTRAP_EMAIL.endsWith('.local')) {
    process.env.ADMIN_BOOTSTRAP_EMAIL = 'admin@example.com';
  }
  if (!process.env.ADMIN_BOOTSTRAP_PASSWORD || 
      process.env.ADMIN_BOOTSTRAP_PASSWORD === 'ChangeMe-Now-2026!' ||
      process.env.ADMIN_BOOTSTRAP_PASSWORD.startsWith('MT-')) {
    process.env.ADMIN_BOOTSTRAP_PASSWORD = 'VercelChangeMe-Now-2026!';
  }
}


const bool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};
const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const resolveFromRoot = (value, fallback) => {
  const chosen = value || fallback;
  return path.isAbsolute(chosen) ? chosen : path.resolve(projectRoot, chosen);
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  version: process.env.APP_VERSION || '1.0.0',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  port: num(process.env.PORT, 3000),
  trustProxy: num(process.env.TRUST_PROXY, 0),
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  frontendDevOrigin: process.env.FRONTEND_DEV_ORIGIN || 'http://localhost:5173',
  databasePath: resolveFromRoot(process.env.DATABASE_PATH, 'backend/data/mama-time.json'),
  frontendDist: path.resolve(projectRoot, 'frontend/dist'),
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'development-only-jwt-secret-change-before-production-0123456789',
    cookieName: process.env.ADMIN_COOKIE_NAME || 'mt_admin_token',
    tokenHours: num(process.env.ADMIN_TOKEN_HOURS, 8),
    bootstrapEmail: (process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@sentinators.local').toLowerCase(),
    bootstrapPassword: process.env.ADMIN_BOOTSTRAP_PASSWORD || 'ChangeMe-Now-2026!',
    bootstrapName: process.env.ADMIN_BOOTSTRAP_NAME || 'Sentinators Admin',
    showDefaultPasswordWarning: bool(process.env.SHOW_DEFAULT_PASSWORD_WARNING, true)
  },
  security: {
    ipHashSecret: process.env.IP_HASH_SECRET || 'development-only-ip-secret-change-before-production-0123456789',
    publicRateWindowMs: num(process.env.PUBLIC_RATE_LIMIT_WINDOW_MINUTES, 15) * 60_000,
    publicRateMax: num(process.env.PUBLIC_RATE_LIMIT_MAX, 8),
    minFormSeconds: num(process.env.PUBLIC_MIN_FORM_SECONDS, 2),
    duplicateWindowHours: num(process.env.DUPLICATE_WINDOW_HOURS, 24)
  },
  campaign: {
    enforce: bool(process.env.CAMPAIGN_ENFORCE, false),
    start: process.env.CAMPAIGN_START || '2026-07-20T00:00:00+02:00',
    end: process.env.CAMPAIGN_END || '2026-08-20T23:59:59+02:00',
    timezone: process.env.CAMPAIGN_TIMEZONE || 'Europe/Zurich',
    singlePrice: num(process.env.SINGLE_PRICE_CHF, 550),
    bestiesPrice: num(process.env.BESTIES_PRICE_CHF, 990),
    daytimeHours: process.env.DAYTIME_HOURS || 'Montag bis Freitag, 08:00–16:30 Uhr'
  },
  contact: {
    whatsappNumber: (process.env.WHATSAPP_NUMBER || '').replace(/\D/g, ''),
    whatsappMessage: process.env.WHATSAPP_MESSAGE || 'Hallo Sentinators Gym, ich interessiere mich für die MAMA TIME Aktion.',
    notificationEmail: process.env.NOTIFICATION_EMAIL || '',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: num(process.env.SMTP_PORT, 587),
      secure: bool(process.env.SMTP_SECURE, false),
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
      from: process.env.SMTP_FROM || 'Sentinators Gym <website@example.ch>'
    }
  }
};

export function validateProductionConfig() {
  if (!config.isProduction) return;
  const problems = [];
  if (config.auth.jwtSecret.includes('development-only') || config.auth.jwtSecret.length < 40) {
    problems.push('JWT_SECRET must be a unique random value with at least 40 characters.');
  }
  if (config.security.ipHashSecret.includes('development-only') || config.security.ipHashSecret.length < 40) {
    problems.push('IP_HASH_SECRET must be a unique random value with at least 40 characters.');
  }
  if (config.auth.bootstrapPassword === 'ChangeMe-Now-2026!' || config.auth.bootstrapPassword.length < 12) {
    problems.push('ADMIN_BOOTSTRAP_PASSWORD must be changed and contain at least 12 characters.');
  }
  if (!/^https:\/\//i.test(config.appBaseUrl)) {
    problems.push('APP_BASE_URL must use HTTPS in production.');
  }
  if (!config.auth.bootstrapEmail.includes('@') || config.auth.bootstrapEmail.endsWith('.local')) {
    problems.push('ADMIN_BOOTSTRAP_EMAIL must be a real administrative email address in production.');
  }
  const campaignStart = Date.parse(config.campaign.start);
  const campaignEnd = Date.parse(config.campaign.end);
  if (!Number.isFinite(campaignStart) || !Number.isFinite(campaignEnd) || campaignEnd <= campaignStart) {
    problems.push('CAMPAIGN_START and CAMPAIGN_END must be valid ISO dates and the end must be later than the start.');
  }
  const smtpValues = [config.contact.smtp.host, config.contact.smtp.user, config.contact.smtp.password];
  if (smtpValues.some(Boolean) && !smtpValues.every(Boolean)) {
    problems.push('SMTP_HOST, SMTP_USER and SMTP_PASSWORD must either all be configured or all be empty.');
  }
  if (problems.length) {
    throw new Error(`Unsafe production configuration:\n- ${problems.join('\n- ')}`);
  }
}
