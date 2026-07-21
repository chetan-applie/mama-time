import { closeDb, initDb } from '../src/db.js';
import { upsertAdmin } from '../src/services/authService.js';

const [emailArg, passwordArg, nameArg] = process.argv.slice(2);
if (!emailArg || !passwordArg) {
  console.error('Usage: npm run create-admin -- email@example.com StrongPassword "Display Name"');
  process.exit(1);
}
if (passwordArg.length < 12) {
  console.error('The admin password must contain at least 12 characters.');
  process.exit(1);
}

try {
  await initDb();
  const admin = await upsertAdmin({
    email: emailArg,
    password: passwordArg,
    displayName: nameArg || 'Sentinators Admin'
  });
  console.log(`Admin ready: ${admin.email} (ID ${admin.id})`);
} finally {
  await closeDb();
}
