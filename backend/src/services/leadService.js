import { getSettings, query, withTransaction } from '../db.js';
import { cleanString, normalizeEmail, normalizePhone, nowIso, referenceCode } from '../utils/helpers.js';

const STATUS_LABELS = {
  new: 'Neu',
  contacted: 'Kontaktiert',
  callback: 'Rückruf geplant',
  won: 'Abgeschlossen',
  lost: 'Verloren',
  duplicate: 'Duplikat',
  archived: 'Archiviert'
};

const SAFE_LEAD_COLUMNS = `
  l.id, l.reference, l.offer_type, l.offer_label, l.amount_chf,
  l.first_name, l.last_name, l.email, l.phone, l.preferred_contact, l.start_preference,
  l.bestie_first_name, l.bestie_last_name, l.bestie_email, l.bestie_phone,
  l.message, l.privacy_consent, l.privacy_consent_at,
  l.status, l.assigned_to, l.callback_at, l.notes, l.lost_reason,
  l.duplicate_of, l.is_duplicate,
  l.utm_source, l.utm_medium, l.utm_campaign, l.utm_content, l.utm_term,
  l.fbclid, l.gclid, l.referrer, l.landing_url, l.page_variant, l.screen,
  l.user_agent, l.created_at, l.updated_at, l.archived_at,
  duplicate.reference AS duplicate_reference
`;

function normalizeDbValue(value) {
  if (value instanceof Date) return value.toISOString();
  return value;
}

function normalizeRow(row) {
  if (!row) return null;
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalizeDbValue(value)]));
}

export async function publicCampaignSettings() {
  const settings = await getSettings();
  const single = Number(settings.single_price_chf || 550);
  const besties = Number(settings.besties_price_chf || 990);
  return {
    campaignName: settings.campaign_name || 'MAMA TIME',
    campaignEnforce: settings.campaign_enforce === 'true',
    campaignStart: settings.campaign_start,
    campaignEnd: settings.campaign_end,
    campaignTimezone: settings.campaign_timezone || 'Europe/Zurich',
    formEnabled: settings.form_enabled !== 'false',
    singlePriceChf: single,
    bestiesPriceChf: besties,
    savingsChf: (single * 2) - besties,
    savingsPercent: Math.round((((single * 2) - besties) / (single * 2)) * 100),
    bestiesPerPersonChf: Math.round(besties / 2),
    daytimeHours: settings.daytime_hours,
    whatsappNumber: String(settings.whatsapp_number || '').replace(/\D/g, ''),
    whatsappMessage: settings.whatsapp_message || '',
    companyName: settings.company_name || 'Sentinators Gym',
    companyLocation: settings.company_location || 'Weite SG',
    metaPixelEnabled: settings.meta_pixel_enabled === 'true' && /^\d{5,30}$/.test(String(settings.meta_pixel_id || '')),
    metaPixelId: /^\d{5,30}$/.test(String(settings.meta_pixel_id || '')) ? String(settings.meta_pixel_id) : ''
  };
}

export async function createLead(data, context) {
  const settings = await publicCampaignSettings();
  const createdAt = nowIso();
  const normalizedEmail = normalizeEmail(data.email);
  const normalizedPhone = normalizePhone(data.phone);
  const duplicateCutoff = new Date(Date.now() - context.duplicateWindowHours * 3_600_000).toISOString();
  const offerType = data.offer_type;
  const amountChf = offerType === 'besties' ? settings.bestiesPriceChf : settings.singlePriceChf;
  const reference = referenceCode();

  return withTransaction(async (client) => {
    const duplicateResult = await client.query(
      `SELECT id, reference
       FROM leads
       WHERE status <> 'archived'
         AND created_at >= $1
         AND (
           ($2 <> '' AND normalized_email = $2)
           OR ($3 <> '' AND normalized_phone = $3)
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [duplicateCutoff, normalizedEmail, normalizedPhone]
    );
    const existing = duplicateResult.rows[0] || null;

    const values = [
      reference,
      offerType,
      offerType === 'besties' ? '2 Mamas / Besties' : '1 Mama',
      amountChf,
      cleanString(data.first_name, 80),
      cleanString(data.last_name, 80),
      cleanString(data.email, 180),
      normalizedEmail,
      cleanString(data.phone, 50),
      normalizedPhone,
      cleanString(data.preferred_contact, 50),
      cleanString(data.start_preference, 120),
      offerType === 'besties' ? cleanString(data.bestie_first_name, 80) : '',
      offerType === 'besties' ? cleanString(data.bestie_last_name, 80) : '',
      offerType === 'besties' ? cleanString(data.bestie_email, 180) : '',
      offerType === 'besties' ? cleanString(data.bestie_phone, 50) : '',
      cleanString(data.message, 2000),
      createdAt,
      existing ? 'duplicate' : 'new',
      existing?.id || null,
      Boolean(existing),
      cleanString(data.utm_source, 255),
      cleanString(data.utm_medium, 255),
      cleanString(data.utm_campaign, 255),
      cleanString(data.utm_content, 255),
      cleanString(data.utm_term, 255),
      cleanString(data.fbclid, 500),
      cleanString(data.gclid, 500),
      cleanString(data.referrer, 1000),
      cleanString(data.landing_url, 1000),
      cleanString(data.page_variant, 100),
      cleanString(data.screen, 100),
      cleanString(context.ipHash, 128),
      cleanString(context.userAgent, 600),
      createdAt,
      createdAt
    ];

    const inserted = await client.query(
      `INSERT INTO leads (
        reference, offer_type, offer_label, amount_chf,
        first_name, last_name, email, normalized_email, phone, normalized_phone,
        preferred_contact, start_preference,
        bestie_first_name, bestie_last_name, bestie_email, bestie_phone,
        message, privacy_consent, privacy_consent_at,
        status, assigned_to, callback_at, notes, lost_reason,
        duplicate_of, is_duplicate,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        fbclid, gclid, referrer, landing_url, page_variant, screen,
        ip_hash, user_agent, created_at, updated_at, archived_at
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8, $9, $10,
        $11, $12,
        $13, $14, $15, $16,
        $17, TRUE, $18,
        $19, '', '', '', '',
        $20, $21,
        $22, $23, $24, $25, $26,
        $27, $28, $29, $30, $31, $32,
        $33, $34, $35, $36, NULL
      )
      RETURNING *`,
      values
    );

    const lead = inserted.rows[0];
    await client.query(
      `INSERT INTO lead_activities (lead_id, actor_type, actor_id, action, details_json, created_at)
       VALUES ($1, 'system', NULL, $2, $3::jsonb, $4)`,
      [
        lead.id,
        existing ? 'lead_created_duplicate' : 'lead_created',
        JSON.stringify({
          offer_type: offerType,
          amount_chf: amountChf,
          duplicate_of: existing?.reference || null
        }),
        createdAt
      ]
    );

    const safe = normalizeRow(lead);
    delete safe.normalized_email;
    delete safe.normalized_phone;
    delete safe.ip_hash;
    safe.duplicate_reference = existing?.reference || null;
    return safe;
  });
}

export async function dashboardStats() {
  const result = await query(
    `SELECT status, offer_type, amount_chf, utm_source, created_at
     FROM leads
     WHERE status <> 'archived'`
  );
  const leads = result.rows.map(normalizeRow);
  const stats = {
    total: leads.length,
    new: 0,
    besties: 0,
    pipelineChf: 0,
    wonRevenueChf: 0,
    won: 0,
    lost: 0,
    duplicates: 0
  };
  const sources = new Map();
  const daily = new Map();
  const cutoff = Date.now() - 30 * 86_400_000;

  for (const lead of leads) {
    if (lead.status === 'new') stats.new += 1;
    if (lead.offer_type === 'besties') stats.besties += 1;
    if (['new', 'contacted', 'callback'].includes(lead.status)) stats.pipelineChf += Number(lead.amount_chf || 0);
    if (lead.status === 'won') {
      stats.won += 1;
      stats.wonRevenueChf += Number(lead.amount_chf || 0);
    }
    if (lead.status === 'lost') stats.lost += 1;
    if (lead.status === 'duplicate') stats.duplicates += 1;

    const source = lead.utm_source || 'direct';
    sources.set(source, (sources.get(source) || 0) + 1);
    const time = new Date(lead.created_at).getTime();
    if (time >= cutoff) {
      const day = String(lead.created_at).slice(0, 10);
      daily.set(day, (daily.get(day) || 0) + 1);
    }
  }

  const qualifiedTotal = Math.max(0, stats.total - stats.duplicates);
  return {
    ...stats,
    qualifiedTotal,
    conversionRate: qualifiedTotal ? Math.round((stats.won / qualifiedTotal) * 1000) / 10 : 0,
    sources: [...sources.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    daily: [...daily.entries()]
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day))
  };
}

function buildLeadFilter(filters = {}) {
  const clauses = [];
  const values = [];
  const add = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (!filters.includeArchived) clauses.push("l.status <> 'archived'");
  if (filters.status) clauses.push(`l.status = ${add(filters.status)}`);
  if (filters.offer) clauses.push(`l.offer_type = ${add(filters.offer)}`);
  if (filters.source) {
    if (filters.source === 'direct') clauses.push("COALESCE(NULLIF(l.utm_source, ''), 'direct') = 'direct'");
    else clauses.push(`l.utm_source = ${add(filters.source)}`);
  }
  if (filters.dateFrom) clauses.push(`l.created_at >= ${add(`${filters.dateFrom}T00:00:00.000Z`)}`);
  if (filters.dateTo) clauses.push(`l.created_at <= ${add(`${filters.dateTo}T23:59:59.999Z`)}`);
  if (filters.q) {
    const queryText = String(filters.q).toLowerCase();
    const textParam = add(`%${queryText}%`);
    const phoneTerm = String(filters.q).replace(/\D/g, '');
    const phoneClause = phoneTerm ? ` OR l.normalized_phone LIKE ${add(`%${phoneTerm}%`)}` : '';
    clauses.push(`(
      LOWER(
        COALESCE(l.reference, '') || ' ' ||
        COALESCE(l.first_name, '') || ' ' ||
        COALESCE(l.last_name, '') || ' ' ||
        COALESCE(l.email, '') || ' ' ||
        COALESCE(l.phone, '') || ' ' ||
        COALESCE(l.bestie_first_name, '') || ' ' ||
        COALESCE(l.bestie_last_name, '')
      ) LIKE ${textParam}${phoneClause}
    )`);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    values
  };
}

function sortSql(sort) {
  const sorters = {
    oldest: 'l.created_at ASC',
    value_desc: 'l.amount_chf DESC, l.created_at DESC',
    callback: "CASE WHEN l.callback_at = '' THEN 1 ELSE 0 END ASC, l.callback_at ASC, l.created_at DESC",
    newest: 'l.created_at DESC'
  };
  return sorters[sort] || sorters.newest;
}

export async function listLeads(filters = {}) {
  const page = Math.max(1, Number(filters.page || 1));
  const perPage = Math.min(100000, Math.max(10, Number(filters.perPage || 25)));
  const offset = (page - 1) * perPage;
  const built = buildLeadFilter(filters);
  const countQuery = `SELECT COUNT(*)::int AS total FROM leads l ${built.where}`;

  const listValues = [...built.values, perPage, offset];
  const limitParam = `$${listValues.length - 1}`;
  const offsetParam = `$${listValues.length}`;
  const rowsQuery = `
    SELECT ${SAFE_LEAD_COLUMNS}
    FROM leads l
    LEFT JOIN leads duplicate ON duplicate.id = l.duplicate_of
    ${built.where}
    ORDER BY ${sortSql(filters.sort)}
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `;

  const [countResult, rowsResult] = await Promise.all([
    query(countQuery, built.values),
    query(rowsQuery, listValues)
  ]);
  const total = Number(countResult.rows[0]?.total || 0);
  return {
    rows: rowsResult.rows.map(normalizeRow),
    pagination: {
      page,
      perPage,
      total,
      pages: Math.max(1, Math.ceil(total / perPage))
    }
  };
}

export async function getLead(idOrReference) {
  const isId = /^\d+$/.test(String(idOrReference));
  const result = await query(
    `SELECT ${SAFE_LEAD_COLUMNS}
     FROM leads l
     LEFT JOIN leads duplicate ON duplicate.id = l.duplicate_of
     WHERE ${isId ? 'l.id = $1' : 'l.reference = $1'}
     LIMIT 1`,
    [isId ? Number(idOrReference) : String(idOrReference)]
  );
  const lead = normalizeRow(result.rows[0]);
  if (!lead) return null;

  const activities = await query(
    `SELECT a.id, a.lead_id, a.actor_type, a.actor_id, a.action, a.details_json,
            a.created_at, admin.display_name AS actor_name
     FROM lead_activities a
     LEFT JOIN admins admin ON admin.id = a.actor_id
     WHERE a.lead_id = $1
     ORDER BY a.created_at DESC`,
    [lead.id]
  );
  return {
    ...lead,
    activities: activities.rows.map((row) => {
      const normalized = normalizeRow(row);
      return {
        ...normalized,
        details: normalized.details_json || {},
        details_json: typeof normalized.details_json === 'string'
          ? normalized.details_json
          : JSON.stringify(normalized.details_json || {})
      };
    })
  };
}

export async function updateLead(id, patch, admin) {
  const numericId = Number(id);
  return withTransaction(async (client) => {
    const currentResult = await client.query('SELECT * FROM leads WHERE id = $1 FOR UPDATE', [numericId]);
    const current = currentResult.rows[0];
    if (!current) return null;

    const fields = ['status', 'assigned_to', 'callback_at', 'notes', 'lost_reason'];
    const values = {};
    const changes = {};
    for (const key of fields) {
      values[key] = patch[key] || '';
      if (String(current[key] || '') !== String(values[key])) {
        changes[key] = { from: current[key] || '', to: values[key] || '' };
      }
    }

    const updatedAt = nowIso();
    await client.query(
      `UPDATE leads
       SET status = $2,
           assigned_to = $3,
           callback_at = $4,
           notes = $5,
           lost_reason = $6,
           archived_at = CASE
             WHEN $2 = 'archived' THEN COALESCE(archived_at, $7::timestamptz)
             ELSE NULL
           END,
           updated_at = $7
       WHERE id = $1`,
      [
        numericId,
        values.status,
        values.assigned_to,
        values.callback_at,
        values.notes,
        values.lost_reason,
        updatedAt
      ]
    );

    await client.query(
      `INSERT INTO lead_activities (lead_id, actor_type, actor_id, action, details_json, created_at)
       VALUES ($1, 'admin', $2, 'lead_updated', $3::jsonb, $4)`,
      [numericId, admin.id, JSON.stringify(changes), updatedAt]
    );

    return getLeadWithinClient(client, numericId);
  });
}

async function getLeadWithinClient(client, id) {
  const result = await client.query(
    `SELECT ${SAFE_LEAD_COLUMNS}
     FROM leads l
     LEFT JOIN leads duplicate ON duplicate.id = l.duplicate_of
     WHERE l.id = $1
     LIMIT 1`,
    [id]
  );
  const lead = normalizeRow(result.rows[0]);
  if (!lead) return null;
  const activities = await client.query(
    `SELECT a.id, a.lead_id, a.actor_type, a.actor_id, a.action, a.details_json,
            a.created_at, admin.display_name AS actor_name
     FROM lead_activities a
     LEFT JOIN admins admin ON admin.id = a.actor_id
     WHERE a.lead_id = $1
     ORDER BY a.created_at DESC`,
    [id]
  );
  return {
    ...lead,
    activities: activities.rows.map((row) => {
      const normalized = normalizeRow(row);
      return {
        ...normalized,
        details: normalized.details_json || {},
        details_json: typeof normalized.details_json === 'string'
          ? normalized.details_json
          : JSON.stringify(normalized.details_json || {})
      };
    })
  };
}

export function statusLabels() {
  return STATUS_LABELS;
}

export async function exportLeadRows(filters = {}) {
  const result = await listLeads({ ...filters, page: 1, perPage: 100000 });
  return result.rows;
}
