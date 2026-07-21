import { config } from '../src/config.js';
import { closeDb, initDb, query } from '../src/db.js';

const confirmed = process.argv.includes('--confirm=RESET-MAMA-TIME');
if (!confirmed) {
  console.error('Destructive command blocked. Re-run with --confirm=RESET-MAMA-TIME.');
  process.exit(1);
}
if (config.isProduction && process.env.ALLOW_DESTRUCTIVE_RESET !== 'true') {
  console.error('Production reset blocked. Set ALLOW_DESTRUCTIVE_RESET=true only for an approved maintenance window.');
  process.exit(1);
}

try {
  await initDb();
  await query('TRUNCATE TABLE lead_activities, leads RESTART IDENTITY CASCADE');
  console.log('All leads and lead activities were deleted. Admins and settings were preserved.');
} finally {
  await closeDb();
}
