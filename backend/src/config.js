import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const bool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};
const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';
const isTest = env === 'test';

export const config = {
  env,
  version: process.env.APP_VERSION || '2.1.0',
  isProduction,
  isTest,
  port: num(process.env.PORT, 3000),
  trustProxy: num(process.env.TRUST_PROXY, 0),
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  frontendDevOrigin: process.env.FRONTEND_DEV_ORIGIN || 'http://localhost:5173',
  frontendDist: path.resolve(projectRoot, 'frontend/dist'),
  database: {
    url: process.env.DATABASE_URL || 'postgresql://mama_time:mama_time_dev_password@127.0.0.1:5432/mama_time',
    useMemory: bool(process.env.DATABASE_USE_PGMEM, isTest),
    ssl: bool(process.env.DATABASE_SSL, false),
    sslRejectUnauthorized: bool(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED, true),
    poolMax: Math.max(1, Math.min(50, num(process.env.DATABASE_POOL_MAX, 10))),
    idleTimeoutMs: Math.max(1000, num(process.env.DATABASE_IDLE_TIMEOUT_MS, 30000)),
    connectionTimeoutMs: Math.max(1000, num(process.env.DATABASE_CONNECTION_TIMEOUT_MS, 10000)),
    runMigrationsOnStart: bool(process.env.RUN_MIGRATIONS_ON_START, true),
    logQueries: bool(process.env.DATABASE_LOG_QUERIES, false)
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'development-only-jwt-secret-change-before-production-0123456789',
    cookieName: process.env.ADMIN_COOKIE_NAME || 'mt_admin_token',
    tokenHours: num(process.env.ADMIN_TOKEN_HOURS, 8),
    bootstrapEmail: (process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@sentinators.local').toLowerCase(),
    bootstrapPassword: process.env.ADMIN_BOOTSTRAP_PASSWORD || 'ChangeMe-Now-2026!',
    bootstrapName: process.env.ADMIN_BOOTSTRAP_NAME || 'Sentinators Admin',
    showDefaultPasswordWarning: bool(process.env.SHOW_DEFAULT_PASSWORD_WARNING, true)
  },
  tracking: {
    metaPixelEnabled: bool(process.env.META_PIXEL_ENABLED, false),
    metaPixelId: String(process.env.META_PIXEL_ID || '').trim()
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
      from: process.env.SMTP_FROM || 'Sentinator GmbH <info@sentinator.li>'
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
  if (!/^postgres(?:ql)?:\/\//i.test(config.database.url)) {
    problems.push('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }
  if (/mama_time_dev_password|password@localhost|password@127\.0\.0\.1/i.test(config.database.url)) {
    problems.push('DATABASE_URL still contains a documented development password or local-only credential.');
  }
  if (config.database.useMemory) {
    problems.push('DATABASE_USE_PGMEM must be false in production. pg-mem is test-only.');
  }

  const campaignStart = Date.parse(config.campaign.start);
  const campaignEnd = Date.parse(config.campaign.end);
  if (!Number.isFinite(campaignStart) || !Number.isFinite(campaignEnd) || campaignEnd <= campaignStart) {
    problems.push('CAMPAIGN_START and CAMPAIGN_END must be valid ISO dates and the end must be later than the start.');
  }
  if (config.tracking.metaPixelEnabled && !/^\d{5,30}$/.test(config.tracking.metaPixelId)) {
    problems.push('META_PIXEL_ID must contain 5 to 30 digits when META_PIXEL_ENABLED=true.');
  }
  const smtpValues = [config.contact.smtp.host, config.contact.smtp.user, config.contact.smtp.password];
  if (smtpValues.some(Boolean) && !smtpValues.every(Boolean)) {
    problems.push('SMTP_HOST, SMTP_USER and SMTP_PASSWORD must either all be configured or all be empty.');
  }
  if (problems.length) {
    throw new Error(`Unsafe production configuration:\n- ${problems.join('\n- ')}`);
  }
}
