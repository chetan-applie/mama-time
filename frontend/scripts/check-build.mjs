import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const required = [
  'src/main.jsx',
  'src/App.jsx',
  'src/pages/LandingPage.jsx',
  'src/components/LeadModal.jsx',
  'src/components/CookieConsent.jsx',
  'src/lib/metaPixel.js',
  'src/pages/AdminDashboardPage.jsx',
  'src/pages/AdminLeadDetailPage.jsx',
  'src/pages/AdminSettingsPage.jsx',
  'src/styles/landing.css',
  'src/styles/admin.css',
  'public/assets/hero-mamas-desktop.webp',
  'public/assets/hero-mamas-mobile.webp',
  'public/assets/audience-mama.webp',
  'dist/index.html'
];

const errors = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Missing frontend file: ${file}`);
}

const landingPath = path.join(root, 'src/pages/LandingPage.jsx');
if (fs.existsSync(landingPath)) {
  const landing = fs.readFileSync(landingPath, 'utf8');
  for (const phrase of [
    'Die Kinder sind wieder in der Schule.',
    'Jetzt bist du dran.',
    'ANGEBOTSVERGLEICH',
    'BELIEBTESTE WAHL',
    'HÄUFIGE FRAGEN',
    'SICHERE DIR JETZT'
  ]) {
    if (!landing.includes(phrase)) errors.push(`Landing page phrase missing: ${phrase}`);
  }
  if (/4\.9 Sterne|über 120 Bewertungen|Sandra, 34|Nicole, 39|Julia, 36/.test(landing)) {
    errors.push('Unverified testimonial/rating copy must not be published.');
  }
}


const legalPath = path.join(root, 'src/pages/LegalPage.jsx');
if (fs.existsSync(legalPath)) {
  const legal = fs.readFileSync(legalPath, 'utf8');
  for (const phrase of ['Sentinator GmbH', 'Hauptstrasse 11', '9476 Weite', 'info@sentinator.li', 'Meta Pixel und Marketing-Einwilligung']) {
    if (!legal.includes(phrase)) errors.push(`Legal page phrase missing: ${phrase}`);
  }
  if (/\[(?:ergänzen|Rechtlicher Firmenname|Vollständige Firmenbezeichnung|Strasse und Hausnummer|PLZ Ort)/i.test(legal)) {
    errors.push('Legal pages still contain business-information placeholders.');
  }
}

const appPath = path.join(root, 'src/App.jsx');
if (fs.existsSync(appPath)) {
  const app = fs.readFileSync(appPath, 'utf8');
  if (!app.includes('trackingAllowed: !adminRoute') || !app.includes('/^\\/admin')) {
    errors.push('Admin-route Meta Pixel exclusion is missing.');
  }
}

const trackingPath = path.join(root, 'src/lib/metaPixel.js');
if (fs.existsSync(trackingPath)) {
  const tracking = fs.readFileSync(trackingPath, 'utf8');
  for (const phrase of ['getMarketingConsent', 'setMarketingConsent', "window.fbq('track', 'PageView')", "window.fbq('track', 'ViewContent'"]) {
    if (!tracking.includes(phrase)) errors.push(`Meta Pixel implementation phrase missing: ${phrase}`);
  }
  if (!tracking.includes("'content_name', 'content_category', 'content_type', 'offer_type'")) {
    errors.push('Meta Pixel safe parameter allowlist missing.');
  }
}

const distAssets = path.join(root, 'dist/assets');
if (fs.existsSync(distAssets)) {
  const maps = fs.readdirSync(distAssets).filter((name) => name.endsWith('.map'));
  if (maps.length) errors.push(`Production source maps found: ${maps.join(', ')}`);
}

if (errors.length) {
  for (const error of errors) console.error(error);
  process.exit(1);
}
console.log('Frontend production/source check passed.');
