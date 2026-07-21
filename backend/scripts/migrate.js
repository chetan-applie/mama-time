import { closeDb, migrateDb } from '../src/db.js';

try {
  const migrations = await migrateDb();
  for (const migration of migrations) {
    console.log(`${migration.applied && migration.checksumValid ? '✓' : '!'} ${migration.name}`);
  }
  console.log('PostgreSQL migrations are up to date.');
} finally {
  await closeDb();
}
