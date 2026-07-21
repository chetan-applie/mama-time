import { closeDb, getDatabaseInfo, query } from '../src/db.js';

try {
  const info = await getDatabaseInfo();
  const counts = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM admins) AS admins,
      (SELECT COUNT(*)::int FROM leads) AS leads,
      (SELECT COUNT(*)::int FROM lead_activities) AS activities,
      (SELECT COUNT(*)::int FROM app_settings) AS settings
  `);
  console.log(JSON.stringify({ ...info, counts: counts.rows[0] }, null, 2));
} finally {
  await closeDb();
}
