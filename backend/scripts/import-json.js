import fs from 'node:fs';
import path from 'node:path';
import { config } from '../src/config.js';
import { closeDb, initDb, query, withTransaction } from '../src/db.js';

const args = process.argv.slice(2);
const fileArg = args.find((arg) => arg.startsWith('--file='));
const positional = args.find((arg) => !arg.startsWith('--'));
const file = path.resolve(fileArg ? fileArg.slice(7) : (positional || ''));
const replace = args.includes('--replace=1');

if (!file || !fs.existsSync(file)) {
  console.error('Usage: npm run db:import-json -- --file=/absolute/path/mama-time.json [--replace=1]');
  process.exit(1);
}
if (config.isProduction && process.env.ALLOW_JSON_IMPORT !== 'true') {
  console.error('Production JSON import is blocked. Set ALLOW_JSON_IMPORT=true only for an approved migration window.');
  process.exit(1);
}

const source = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!Array.isArray(source.leads) || !source.settings || typeof source.settings !== 'object') {
  console.error('The source file is not a valid MAMA TIME v1 JSON data file.');
  process.exit(1);
}

function iso(value, fallback = new Date().toISOString()) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}
function text(value, fallback = '') {
  return value === undefined || value === null ? fallback : String(value);
}
function jsonValue(value) {
  if (value && typeof value === 'object') return value;
  try { return JSON.parse(value || '{}'); } catch { return {}; }
}

try {
  await initDb();
  const existing = await query('SELECT COUNT(*)::int AS count FROM leads');
  if (Number(existing.rows[0]?.count || 0) > 0 && !replace) {
    console.error('The PostgreSQL database already contains leads. Re-run with --replace=1 only after creating a backup.');
    process.exitCode = 1;
  } else {
    const result = await withTransaction(async (client) => {
      if (replace) await client.query('TRUNCATE TABLE lead_activities, leads RESTART IDENTITY CASCADE');

      for (const [key, value] of Object.entries(source.settings || {})) {
        await client.query(
          `INSERT INTO app_settings (key, value, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [key, text(value)]
        );
      }

      const adminMap = new Map();
      for (const oldAdmin of source.admins || []) {
        if (!oldAdmin.email || !oldAdmin.password_hash) continue;
        const admin = await client.query(
          `INSERT INTO admins (
             email, password_hash, display_name, role, active, auth_version,
             created_at, updated_at, last_login_at
           ) VALUES ($1, $2, $3, 'admin', $4, $5, $6, $7, $8)
           ON CONFLICT (email) DO UPDATE SET
             password_hash = EXCLUDED.password_hash,
             display_name = EXCLUDED.display_name,
             active = EXCLUDED.active,
             auth_version = GREATEST(admins.auth_version, EXCLUDED.auth_version),
             updated_at = EXCLUDED.updated_at,
             last_login_at = EXCLUDED.last_login_at
           RETURNING id`,
          [
            text(oldAdmin.email).toLowerCase(),
            text(oldAdmin.password_hash),
            text(oldAdmin.display_name, 'Sentinators Admin'),
            oldAdmin.active !== false,
            Math.max(1, Number(oldAdmin.auth_version || 1)),
            iso(oldAdmin.created_at),
            iso(oldAdmin.updated_at),
            oldAdmin.last_login_at ? iso(oldAdmin.last_login_at) : null
          ]
        );
        adminMap.set(Number(oldAdmin.id), Number(admin.rows[0].id));
      }

      const leadMap = new Map();
      for (const oldLead of source.leads) {
        const createdAt = iso(oldLead.created_at);
        const updatedAt = iso(oldLead.updated_at, createdAt);
        const inserted = await client.query(
          `INSERT INTO leads (
             reference, offer_type, offer_label, amount_chf,
             first_name, last_name, email, normalized_email, phone, normalized_phone,
             preferred_contact, start_preference,
             bestie_first_name, bestie_last_name, bestie_email, bestie_phone,
             message, privacy_consent, privacy_consent_at,
             status, assigned_to, callback_at, notes, lost_reason,
             duplicate_of, is_duplicate,
             utm_source, utm_medium, utm_campaign, utm_content, utm_term,
             fbclid, gclid, referrer, landing_url, page_variant, screen,
             ip_hash, user_agent, created_at, updated_at, archived_at
           ) VALUES (
             $1, $2, $3, $4,
             $5, $6, $7, $8, $9, $10,
             $11, $12,
             $13, $14, $15, $16,
             $17, $18, $19,
             $20, $21, $22, $23, $24,
             NULL, FALSE,
             $25, $26, $27, $28, $29,
             $30, $31, $32, $33, $34, $35,
             $36, $37, $38, $39, $40
           ) RETURNING id`,
          [
            text(oldLead.reference),
            ['single', 'besties'].includes(oldLead.offer_type) ? oldLead.offer_type : 'single',
            text(oldLead.offer_label, oldLead.offer_type === 'besties' ? '2 Mamas / Besties' : '1 Mama'),
            Number(oldLead.amount_chf || (oldLead.offer_type === 'besties' ? 990 : 550)),
            text(oldLead.first_name), text(oldLead.last_name), text(oldLead.email), text(oldLead.normalized_email, text(oldLead.email).toLowerCase()),
            text(oldLead.phone), text(oldLead.normalized_phone, text(oldLead.phone).replace(/\D/g, '')),
            text(oldLead.preferred_contact), text(oldLead.start_preference),
            text(oldLead.bestie_first_name), text(oldLead.bestie_last_name), text(oldLead.bestie_email), text(oldLead.bestie_phone),
            text(oldLead.message), Boolean(oldLead.privacy_consent), iso(oldLead.privacy_consent_at, createdAt),
            ['new', 'contacted', 'callback', 'won', 'lost', 'duplicate', 'archived'].includes(oldLead.status) ? oldLead.status : 'new',
            text(oldLead.assigned_to), text(oldLead.callback_at), text(oldLead.notes), text(oldLead.lost_reason),
            text(oldLead.utm_source), text(oldLead.utm_medium), text(oldLead.utm_campaign), text(oldLead.utm_content), text(oldLead.utm_term),
            text(oldLead.fbclid), text(oldLead.gclid), text(oldLead.referrer), text(oldLead.landing_url), text(oldLead.page_variant), text(oldLead.screen),
            text(oldLead.ip_hash), text(oldLead.user_agent), createdAt, updatedAt,
            oldLead.archived_at ? iso(oldLead.archived_at) : null
          ]
        );
        leadMap.set(Number(oldLead.id), Number(inserted.rows[0].id));
      }

      for (const oldLead of source.leads) {
        const newId = leadMap.get(Number(oldLead.id));
        const duplicateId = leadMap.get(Number(oldLead.duplicate_of));
        if (newId && duplicateId) {
          await client.query(
            'UPDATE leads SET duplicate_of = $2, is_duplicate = TRUE WHERE id = $1',
            [newId, duplicateId]
          );
        }
      }

      let activityCount = 0;
      for (const oldActivity of source.activities || []) {
        const leadId = leadMap.get(Number(oldActivity.lead_id));
        if (!leadId) continue;
        const actorId = oldActivity.actor_id ? (adminMap.get(Number(oldActivity.actor_id)) || null) : null;
        await client.query(
          `INSERT INTO lead_activities (
             lead_id, actor_type, actor_id, action, details_json, created_at
           ) VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          [
            leadId,
            oldActivity.actor_type === 'admin' ? 'admin' : 'system',
            actorId,
            text(oldActivity.action, 'imported_activity'),
            JSON.stringify(jsonValue(oldActivity.details_json)),
            iso(oldActivity.created_at)
          ]
        );
        activityCount += 1;
      }

      return { leads: leadMap.size, activities: activityCount, admins: adminMap.size };
    });
    console.log(`Import completed: ${result.leads} leads, ${result.activities} activities, ${result.admins} admin mappings.`);
  }
} finally {
  await closeDb();
}
