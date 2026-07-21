import { z } from 'zod';

const optionalText = (max = 255) => z.preprocess(
  (value) => (value === undefined || value === null ? '' : String(value)),
  z.string().trim().max(max)
);

const requiredText = (label, max = 255) => z.preprocess(
  (value) => (value === undefined || value === null ? '' : String(value)),
  z.string().trim().min(1, `${label} ist erforderlich.`).max(max, `${label} ist zu lang.`)
);

const email = z.preprocess(
  (value) => (value === undefined || value === null ? '' : String(value)),
  z.string().trim().email('Bitte gib eine gültige E-Mail-Adresse ein.').max(180)
);

const phone = z.preprocess(
  (value) => (value === undefined || value === null ? '' : String(value)),
  z.string().trim().min(7, 'Bitte gib eine gültige Mobilnummer ein.').max(50)
    .refine((value) => value.replace(/\D/g, '').length >= 7, 'Bitte gib eine gültige Mobilnummer ein.')
);

export const leadSchema = z.object({
  offer_type: z.enum(['single', 'besties']),
  first_name: requiredText('Vorname', 80),
  last_name: requiredText('Nachname', 80),
  email,
  phone,
  bestie_first_name: optionalText(80),
  bestie_last_name: optionalText(80),
  bestie_email: optionalText(180).refine((value) => value === '' || z.string().email().safeParse(value).success, 'Bitte gib eine gültige E-Mail-Adresse der Bestie ein.'),
  bestie_phone: optionalText(50),
  preferred_contact: z.enum(['Telefon', 'WhatsApp', 'E-Mail'], { errorMap: () => ({ message: 'Bitte wähle eine Kontaktart.' }) }),
  start_preference: requiredText('Startwunsch', 120),
  message: optionalText(2000),
  privacy: z.preprocess((value) => value === 1 || value === '1' || value === true || value === 'true', z.literal(true, { errorMap: () => ({ message: 'Bitte bestätige die Datenschutzerklärung.' }) })),
  form_started_at: z.preprocess((value) => Number(value || 0), z.number().nonnegative()),
  website: optionalText(120),
  landing_url: optionalText(1000),
  referrer: optionalText(1000),
  utm_source: optionalText(255),
  utm_medium: optionalText(255),
  utm_campaign: optionalText(255),
  utm_content: optionalText(255),
  utm_term: optionalText(255),
  fbclid: optionalText(500),
  gclid: optionalText(500),
  page_variant: optionalText(100),
  screen: optionalText(100)
}).superRefine((data, ctx) => {
  if (data.offer_type === 'besties') {
    if (!data.bestie_first_name) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bestie_first_name'], message: 'Vorname der Bestie ist erforderlich.' });
    if (!data.bestie_last_name) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bestie_last_name'], message: 'Nachname der Bestie ist erforderlich.' });
  }
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(180),
  password: z.string().min(8).max(200)
});

export const leadUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'callback', 'won', 'lost', 'duplicate', 'archived']),
  assigned_to: optionalText(120),
  callback_at: optionalText(80),
  notes: optionalText(5000),
  lost_reason: optionalText(500)
});

export const settingsUpdateSchema = z.object({
  campaign_name: requiredText('Kampagnenname', 100),
  company_name: requiredText('Firmenname', 160),
  company_location: requiredText('Standort', 160),
  campaign_enforce: z.union([z.boolean(), z.string()]).transform((value) => ['true', '1', true].includes(value)),
  campaign_start: requiredText('Kampagnenstart', 80),
  campaign_end: requiredText('Kampagnenende', 80),
  campaign_timezone: requiredText('Zeitzone', 80),
  single_price_chf: z.preprocess((value) => Number(value), z.number().int().min(1).max(100000)),
  besties_price_chf: z.preprocess((value) => Number(value), z.number().int().min(1).max(200000)),
  daytime_hours: requiredText('Daytime-Zeiten', 180),
  whatsapp_number: optionalText(40),
  whatsapp_message: requiredText('WhatsApp-Nachricht', 500),
  notification_email: optionalText(180).refine((value) => value === '' || z.string().email().safeParse(value).success, 'Ungültige Benachrichtigungs-E-Mail.'),
  meta_pixel_enabled: z.union([z.boolean(), z.string()]).transform((value) => ['true', '1', true].includes(value)),
  meta_pixel_id: optionalText(30).refine((value) => value === '' || /^\d{5,30}$/.test(value), 'Die Meta Pixel-ID darf nur aus 5 bis 30 Ziffern bestehen.'),
  form_enabled: z.union([z.boolean(), z.string()]).transform((value) => ['true', '1', true].includes(value))
}).superRefine((data, ctx) => {
  if (data.besties_price_chf >= data.single_price_chf * 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['besties_price_chf'], message: 'Der Besties-Preis muss unter dem Preis von zwei Einzelabos liegen.' });
  }
  if (data.meta_pixel_enabled && !data.meta_pixel_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['meta_pixel_id'], message: 'Bitte trage eine Meta Pixel-ID ein oder deaktiviere den Pixel.' });
  }
  const start = Date.parse(data.campaign_start);
  const end = Date.parse(data.campaign_end);
  if (Number.isFinite(start) && Number.isFinite(end) && end <= start) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['campaign_end'], message: 'Das Kampagnenende muss nach dem Start liegen.' });
  }
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(8).max(200),
  new_password: z.string().min(12, 'Das neue Passwort muss mindestens 12 Zeichen lang sein.').max(200)
});

export function zodFields(error) {
  const fields = {};
  for (const issue of error.issues || []) {
    const key = issue.path?.[0] || '_form';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}
