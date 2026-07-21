import { createApp } from './app.js';
import { config, validateProductionConfig } from './config.js';
import { closeDb } from './db.js';

validateProductionConfig();
const app = await createApp();
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`[MAMA TIME] React + Node + PostgreSQL app listening on ${config.appBaseUrl}`);
  console.log(`[MAMA TIME] Backoffice: ${config.appBaseUrl}/admin`);
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[MAMA TIME] ${signal} received, shutting down...`);
  const forceTimer = setTimeout(() => process.exit(1), 10_000);
  forceTimer.unref();
  server.close(async () => {
    try {
      await closeDb();
      clearTimeout(forceTimer);
      process.exit(0);
    } catch (error) {
      console.error('[MAMA TIME] Shutdown error:', error);
      process.exit(1);
    }
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
