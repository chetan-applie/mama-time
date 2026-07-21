import fs from 'node:fs';
import path from 'node:path';
import { projectRoot } from '../src/config.js';
import { closeDb, logicalBackup } from '../src/db.js';

const directory = path.join(projectRoot, 'backend', 'backups');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.join(directory, `mama-time-logical-${stamp}.json`);

try {
  fs.mkdirSync(directory, { recursive: true });
  const payload = await logicalBackup();
  fs.writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  console.log(`Logical JSON backup created: ${target}`);
} finally {
  await closeDb();
}
