import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { config } from '../src/config.js';

const fileArg = process.argv.find((arg) => arg.startsWith('--file='));
const confirmed = process.argv.includes('--confirm=RESTORE-MAMA-TIME');
if (!fileArg || !confirmed) {
  console.error('Usage: npm run db:restore -- --file=/absolute/path/backup.dump --confirm=RESTORE-MAMA-TIME');
  process.exit(1);
}
if (config.isProduction && process.env.ALLOW_DESTRUCTIVE_RESTORE !== 'true') {
  console.error('Production restore blocked. Set ALLOW_DESTRUCTIVE_RESTORE=true only during an approved maintenance window.');
  process.exit(1);
}
const file = fileArg.slice(7);
if (!fs.existsSync(file)) {
  console.error(`Backup file not found: ${file}`);
  process.exit(1);
}
const url = new URL(config.database.url);
const env = {
  ...process.env,
  PGHOST: url.hostname,
  PGPORT: url.port || '5432',
  PGUSER: decodeURIComponent(url.username),
  PGPASSWORD: decodeURIComponent(url.password),
  PGDATABASE: decodeURIComponent(url.pathname.replace(/^\//, '')),
  PGSSLMODE: config.database.ssl ? (config.database.sslRejectUnauthorized ? 'verify-full' : 'require') : 'disable'
};
const result = spawnSync('pg_restore', [
  '--clean',
  '--if-exists',
  '--no-owner',
  '--no-privileges',
  '--exit-on-error',
  '--dbname', env.PGDATABASE,
  file
], { env, stdio: 'inherit' });
if (result.error?.code === 'ENOENT') {
  console.error('pg_restore was not found. Install the PostgreSQL client tools or run the command inside the supplied Docker image.');
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status || 1);
console.log('PostgreSQL restore completed. Restart the application and run `npm run db:status`.');
