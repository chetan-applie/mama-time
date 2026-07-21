import { config } from '../src/config.js';
import { closeDb, initDb } from '../src/db.js';
import { createLead } from '../src/services/leadService.js';

if (config.isProduction) {
  console.error('Demo seed is disabled in production.');
  process.exit(1);
}

const firstNames = ['Sandra', 'Nicole', 'Julia', 'Martina', 'Laura', 'Nadine', 'Claudia', 'Sabrina'];
const sources = ['facebook', 'instagram', 'direct', 'google'];

try {
  await initDb();
  for (let i = 0; i < 12; i += 1) {
    const besties = i % 3 === 0;
    await createLead({
      offer_type: besties ? 'besties' : 'single',
      first_name: firstNames[i % firstNames.length],
      last_name: `Demo ${i + 1}`,
      email: `demo${i + 1}@example.com`,
      phone: `+41 79 555 ${String(1000 + i).slice(-4)}`,
      preferred_contact: i % 2 ? 'Telefon' : 'WhatsApp',
      start_preference: i % 2 ? 'Im August 2026' : 'Direkt nach den Schulferien',
      bestie_first_name: besties ? `Bestie ${i + 1}` : '',
      bestie_last_name: besties ? 'Demo' : '',
      bestie_email: '',
      bestie_phone: '',
      message: i % 4 === 0 ? 'Bitte am Nachmittag kontaktieren.' : '',
      privacy: true,
      form_started_at: Date.now() - 5000,
      utm_source: sources[i % sources.length],
      utm_medium: i % 2 ? 'paid_social' : 'organic',
      utm_campaign: 'mama-time-demo',
      landing_url: 'http://localhost:3000/?demo=1',
      referrer: '',
      page_variant: 'react-responsive-postgresql',
      screen: '390x844'
    }, {
      ipHash: `demo-${i}`,
      userAgent: 'Demo seed',
      duplicateWindowHours: 0
    });
  }
  console.log('12 demo leads created in PostgreSQL.');
} finally {
  await closeDb();
}
