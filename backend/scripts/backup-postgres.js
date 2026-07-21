import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { config, projectRoot } from '../src/config.js';

if (config.database.useMemory) {
  console.error('pg_dump cannot be used with the pg-mem test database.');
  process.exit(1);
}

const directory = path.join(projectRoot, 'backend', 'backups');
fs.mkdirSync(directory, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.resolve(process.argv.find((arg) => arg.startsWith('--file='))?.slice(7) || path.join(directory, `mama-time-${stamp}.dump`));
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
const result = spawnSync('pg_dump', [
  '--format=custom',
  '--no-owner',
  '--no-privileges',
  '--file', target
], { env, stdio: 'inherit' });
if (result.error?.code === 'ENOENT') {
  console.error('pg_dump was not found. Install the PostgreSQL client tools or run the command inside the supplied Docker image.');
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status || 1);
try { fs.chmodSync(target, 0o600); } catch { /* best effort */ }
console.log(`PostgreSQL custom-format backup created: ${target}`);
