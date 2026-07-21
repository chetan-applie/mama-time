import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { config, projectRoot } from './config.js';

const { Pool, types } = pg;
// PostgreSQL BIGINT values are safe as JavaScript numbers for this campaign-sized application.
types.setTypeParser(20, (value) => Number(value));

types.setTypeParser(1700, (value) => Number(value));

let pool;
let initialized = false;
let initializationPromise;
let memoryDatabase;

const defaultSettings = {
  campaign_name: 'MAMA TIME',
  campaign_enforce: String(config.campaign.enforce),
  campaign_start: config.campaign.start,
  campaign_end: config.campaign.end,
  campaign_timezone: config.campaign.timezone,
  single_price_chf: String(config.campaign.singlePrice),
  besties_price_chf: String(config.campaign.bestiesPrice),
  daytime_hours: config.campaign.daytimeHours,
  whatsapp_number: config.contact.whatsappNumber,
  whatsapp_message: config.contact.whatsappMessage,
  notification_email: config.contact.notificationEmail,
  company_name: 'Sentinators Gym',
  company_location: 'Weite SG',
  form_enabled: 'true',
  meta_pixel_enabled: String(config.tracking.metaPixelEnabled),
  meta_pixel_id: config.tracking.metaPixelId
};

function migrationDirectory() {
  return path.join(projectRoot, 'backend', 'migrations');
}

async function createPool() {
  if (pool) return pool;

  if (config.database.useMemory) {
    const { newDb, DataType } = await import('pg-mem');
    memoryDatabase = newDb({ autoCreateForeignKeyIndices: true });
    // Functions used by status/health checks but not implemented by pg-mem by default.
    memoryDatabase.public.registerFunction({
      name: 'version',
      returns: DataType.text,
      implementation: () => 'PostgreSQL-compatible pg-mem test database'
    });
    memoryDatabase.public.registerFunction({
      name: 'current_database',
      returns: DataType.text,
      implementation: () => 'mama_time_test'
    });
    const adapter = memoryDatabase.adapters.createPg();
    pool = new adapter.Pool();
  } else {
    pool = new Pool({
      connectionString: config.database.url,
      max: config.database.poolMax,
      idleTimeoutMillis: config.database.idleTimeoutMs,
      connectionTimeoutMillis: config.database.connectionTimeoutMs,
      allowExitOnIdle: !config.isProduction,
      ssl: config.database.ssl
        ? { rejectUnauthorized: config.database.sslRejectUnauthorized }
        : undefined,
      application_name: 'mama-time-api'
    });
    pool.on('error', (error) => {
      console.error('[MAMA TIME] Unexpected PostgreSQL pool error:', error);
    });
  }
  return pool;
}

function migrationFiles() {
  const directory = migrationDirectory();
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((name) => /^\d+.*\.sql$/i.test(name))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      sql: fs.readFileSync(path.join(directory, name), 'utf8')
    }));
}

function checksum(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function runMigrationsInternal(databasePool) {
  const client = await databasePool.connect();
  let advisoryLockHeld = false;
  try {
    if (!config.database.useMemory) {
      // Prevent two application instances from applying migrations concurrently.
      await client.query('SELECT pg_advisory_lock($1)', [7420260720]);
      advisoryLockHeld = true;
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        checksum VARCHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const migration of migrationFiles()) {
      const hash = checksum(migration.sql);
      const existing = await client.query(
        'SELECT name, checksum FROM schema_migrations WHERE name = $1',
        [migration.name]
      );
      if (existing.rowCount) {
        if (existing.rows[0].checksum !== hash) {
          throw new Error(`Migration checksum mismatch for ${migration.name}. Never edit an applied migration; add a new migration instead.`);
        }
        continue;
      }

      try {
        await client.query('BEGIN');
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)',
          [migration.name, hash]
        );
        await client.query('COMMIT');
        console.log(`[MAMA TIME] Applied database migration: ${migration.name}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    if (advisoryLockHeld) {
      await client.query('SELECT pg_advisory_unlock($1)', [7420260720]).catch(() => {});
    }
    client.release();
  }
}

async function ensureDefaultSettings(databasePool) {
  const entries = Object.entries(defaultSettings);
  const client = await databasePool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of entries) {
      await client.query(
        `INSERT INTO app_settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        [key, String(value ?? '')]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function ensureBootstrapAdmin(databasePool) {
  const count = await databasePool.query('SELECT COUNT(*)::int AS count FROM admins');
  if (Number(count.rows[0]?.count || 0) > 0) return;

  const hash = bcrypt.hashSync(config.auth.bootstrapPassword, 12);
  await databasePool.query(
    `INSERT INTO admins (email, password_hash, display_name, role, active, auth_version)
     VALUES ($1, $2, $3, 'admin', TRUE, 1)
     ON CONFLICT (email) DO NOTHING`,
    [config.auth.bootstrapEmail, hash, config.auth.bootstrapName]
  );
  console.warn(`[MAMA TIME] Bootstrap admin created: ${config.auth.bootstrapEmail}`);
  if (config.auth.showDefaultPasswordWarning) {
    console.warn('[MAMA TIME] Change the bootstrap password before production.');
  }
}

export async function initDb({ runMigrations = config.database.runMigrationsOnStart } = {}) {
  if (initialized) return pool;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    const databasePool = await createPool();
    await databasePool.query('SELECT 1');
    if (runMigrations) await runMigrationsInternal(databasePool);
    await ensureDefaultSettings(databasePool);
    await ensureBootstrapAdmin(databasePool);
    initialized = true;
    return databasePool;
  })();

  try {
    return await initializationPromise;
  } catch (error) {
    initializationPromise = undefined;
    throw error;
  }
}

export async function migrateDb() {
  const databasePool = await createPool();
  await databasePool.query('SELECT 1');
  await runMigrationsInternal(databasePool);
  await ensureDefaultSettings(databasePool);
  await ensureBootstrapAdmin(databasePool);
  initialized = true;
  return migrationStatusInternal(databasePool);
}

export async function query(text, values = []) {
  const databasePool = await initDb();
  if (config.database.logQueries && !config.isProduction) {
    console.log('[MAMA TIME][SQL]', String(text).replace(/\s+/g, ' ').trim(), values);
  }
  return databasePool.query(text, values);
}

export async function withTransaction(callback) {
  const databasePool = await initDb();
  const client = await databasePool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getSettings() {
  const result = await query('SELECT key, value FROM app_settings ORDER BY key');
  const settings = { ...defaultSettings };
  for (const row of result.rows) settings[row.key] = row.value;
  return settings;
}

export async function updateSettings(pairs) {
  await withTransaction(async (client) => {
    for (const [key, value] of Object.entries(pairs)) {
      await client.query(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key)
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, String(value ?? '')]
      );
    }
  });
  return getSettings();
}

async function migrationStatusInternal(databasePool) {
  const result = await databasePool.query(
    'SELECT name, checksum, applied_at FROM schema_migrations ORDER BY name'
  );
  const applied = new Map(result.rows.map((row) => [row.name, row]));
  return migrationFiles().map((migration) => ({
    name: migration.name,
    checksum: checksum(migration.sql),
    applied: applied.has(migration.name),
    appliedAt: applied.get(migration.name)?.applied_at || null,
    checksumValid: !applied.has(migration.name) || applied.get(migration.name).checksum === checksum(migration.sql)
  }));
}

export async function getMigrationStatus() {
  const databasePool = await initDb();
  return migrationStatusInternal(databasePool);
}

export async function getDatabaseInfo() {
  const databasePool = await initDb();
  const [versionResult, nameResult, sizeResult, migrationStatus] = await Promise.all([
    databasePool.query('SELECT version() AS version'),
    databasePool.query('SELECT current_database() AS name'),
    config.database.useMemory
      ? Promise.resolve({ rows: [{ bytes: 0 }] })
      : databasePool.query('SELECT pg_database_size(current_database())::bigint AS bytes'),
    getMigrationStatus()
  ]);
  return {
    engine: config.database.useMemory ? 'pg-mem (test only)' : 'PostgreSQL',
    databaseName: nameResult.rows[0]?.name || '',
    version: versionResult.rows[0]?.version || '',
    sizeBytes: Number(sizeResult.rows[0]?.bytes || 0),
    pool: {
      total: Number(databasePool.totalCount || 0),
      idle: Number(databasePool.idleCount || 0),
      waiting: Number(databasePool.waitingCount || 0),
      max: config.database.poolMax
    },
    migrations: migrationStatus,
    connected: true
  };
}

export async function logicalBackup() {
  const [settings, leads, activities] = await Promise.all([
    getSettings(),
    query(`SELECT
      id, reference, offer_type, offer_label, amount_chf,
      first_name, last_name, email, phone, preferred_contact, start_preference,
      bestie_first_name, bestie_last_name, bestie_email, bestie_phone,
      message, privacy_consent, privacy_consent_at,
      status, assigned_to, callback_at, notes, lost_reason,
      duplicate_of, is_duplicate,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      fbclid, gclid, referrer, landing_url, page_variant, screen,
      user_agent, created_at, updated_at, archived_at
      FROM leads ORDER BY id`),
    query(`SELECT id, lead_id, actor_type, actor_id, action, details_json, created_at
           FROM lead_activities ORDER BY id`)
  ]);
  return {
    product: 'MAMA TIME React + Node + PostgreSQL',
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    settings,
    leads: leads.rows,
    activities: activities.rows
  };
}

export async function closeDb() {
  if (pool) await pool.end();
  pool = undefined;
  memoryDatabase = undefined;
  initialized = false;
  initializationPromise = undefined;
}

// Test utility. Not used by production code.
export async function resetInMemoryDatabaseForTests() {
  await closeDb();
}
