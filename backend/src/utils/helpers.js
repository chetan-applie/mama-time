import crypto from 'node:crypto';
import { DateTime } from 'luxon';
import { config } from '../config.js';

export const nowIso = () => new Date().toISOString();

export function cleanString(value, max = 255) {
  return String(value ?? '').trim().slice(0, max);
}

export function normalizeEmail(value) {
  return cleanString(value, 180).toLowerCase();
}

export function normalizePhone(value) {
  return cleanString(value, 50).replace(/\D/g, '');
}

export function referenceCode() {
  return `MT-${new Date().getUTCFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || '0.0.0.0';
}

export function ipHash(req) {
  return crypto
    .createHmac('sha256', config.security.ipHashSecret)
    .update(clientIp(req))
    .digest('hex');
}

export function timingSafeEqualString(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export function normalizeCampaignDateTime(value, timezone = 'Europe/Zurich') {
  const text = cleanString(value, 80);
  if (!text) return '';
  const parsed = DateTime.fromISO(text, { zone: timezone, setZone: /(?:Z|[+-]\d{2}:?\d{2})$/.test(text) });
  if (!parsed.isValid) return text;
  return parsed.setZone(timezone).toISO({ suppressMilliseconds: true, includeOffset: true });
}

export function campaignStatus(settings) {
  const now = Date.now();
  const start = Date.parse(settings.campaign_start);
  const end = Date.parse(settings.campaign_end);
  if (Number.isFinite(start) && now < start) return 'scheduled';
  if (Number.isFinite(end) && now > end) return 'expired';
  return 'active';
}

export function formatCsvCell(value) {
  let text = String(value ?? '').replace(/\r?\n/g, ' ');
  // Prevent spreadsheet formula execution when a CSV is opened in Excel/LibreOffice.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function safeJson(value, fallback = {}) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function asyncHandler(handler) {
  return function wrappedAsyncHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
