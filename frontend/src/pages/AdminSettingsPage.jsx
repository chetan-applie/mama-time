import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../lib/AuthContext.jsx';
import { downloadUrl } from '../lib/api.js';

const DEFAULT_TIMEZONE = 'Europe/Zurich';

export default function AdminSettingsPage() {
  const { authFetch } = useAuth();
  const [form, setForm] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [database, setDatabase] = useState(null);

  useEffect(() => {
    authFetch('/api/admin/settings')
      .then((result) => setForm(result.settings))
      .catch((err) => setError(err.message));
    authFetch('/api/admin/system/database')
      .then((result) => setDatabase(result.database))
      .catch(() => setDatabase(null));
  }, [authFetch]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setFieldErrors({});
    setSaved(false);
    try {
      const result = await authFetch('/api/admin/settings', { method: 'PATCH', body: JSON.stringify(form) });
      setForm(normalizeResponse(result.settings));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      setFieldErrors(err.fields || {});
      setError(err.message || 'Einstellungen konnten nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  const savings = useMemo(() => {
    if (!form) return null;
    const single = Number(form.single_price_chf || 0);
    const besties = Number(form.besties_price_chf || 0);
    const regular = single * 2;
    return {
      chf: Math.max(0, regular - besties),
      percent: regular > 0 ? Math.round(((regular - besties) / regular) * 100) : 0,
      perPerson: besties > 0 ? besties / 2 : 0
    };
  }, [form]);

  return (
    <>
      <section className="admin-title">
        <div>
          <p className="admin-eyebrow">KAMPAGNENKONFIGURATION</p>
          <h1>Einstellungen</h1>
          <p>Öffentliche Preise, Zeitraum, Kontaktangaben, Meta Pixel und Formularstatus ohne Code ändern.</p>
        </div>
      </section>
      {saved && <div className="admin-alert admin-alert--success">Einstellungen wurden gespeichert und gelten sofort.</div>}
      {error && <div className="admin-alert admin-alert--error">{error}</div>}
      {!form ? <div className="empty-state">Einstellungen werden geladen …</div> : (
        <div className="settings-grid">
          <section className="settings-card">
            <h2>Öffentliche Kampagne</h2>
            <p>Diese Werte werden vom React-Frontend direkt über die geschützte Node-API geladen.</p>
            <form className="admin-form" onSubmit={submit} noValidate>
              <div className="admin-form__row">
                <SettingField label="Kampagnenname" name="campaign_name" value={form.campaign_name || ''} onChange={update} error={fieldErrors.campaign_name} required />
                <SettingField label="Standort" name="company_location" value={form.company_location || ''} onChange={update} error={fieldErrors.company_location} required />
              </div>
              <SettingField label="Firmenname" name="company_name" value={form.company_name || ''} onChange={update} error={fieldErrors.company_name} required />

              <div className="settings-divider"><span>Angebot &amp; Preise</span></div>
              <div className="admin-form__row">
                <SettingField label="Einzelpreis in CHF" type="number" min="1" step="1" name="single_price_chf" value={form.single_price_chf ?? 550} onChange={update} error={fieldErrors.single_price_chf} required />
                <SettingField label="Besties-Preis in CHF" type="number" min="1" step="1" name="besties_price_chf" value={form.besties_price_chf ?? 990} onChange={update} error={fieldErrors.besties_price_chf} required />
              </div>
              {savings && <div className="settings-price-preview"><span>Live-Berechnung</span><strong>CHF {savings.chf}.– Ersparnis · {savings.percent} % · CHF {formatNumber(savings.perPerson)} pro Mama</strong></div>}
              <SettingField label="Daytime-Zeiten" name="daytime_hours" value={form.daytime_hours || ''} onChange={update} error={fieldErrors.daytime_hours} required />

              <div className="settings-divider"><span>Zeitraum</span></div>
              <label className="admin-checkbox"><input type="checkbox" name="campaign_enforce" checked={Boolean(form.campaign_enforce)} onChange={update} /><span>Kampagnenzeitraum technisch erzwingen</span></label>
              <div className="admin-form__row">
                <SettingField label="Start" type="datetime-local" name="campaign_start" value={toInput(form.campaign_start)} onChange={update} error={fieldErrors.campaign_start} required />
                <SettingField label="Ende" type="datetime-local" name="campaign_end" value={toInput(form.campaign_end)} onChange={update} error={fieldErrors.campaign_end} required />
              </div>
              <label>Zeitzone<select name="campaign_timezone" value={form.campaign_timezone || DEFAULT_TIMEZONE} onChange={update}><option value="Europe/Zurich">Europe/Zurich (Schweiz)</option></select>{fieldErrors.campaign_timezone && <small className="field-error">{fieldErrors.campaign_timezone}</small>}</label>

              <div className="settings-divider"><span>Kontakt &amp; Benachrichtigung</span></div>
              <SettingField label="WhatsApp-Nummer" name="whatsapp_number" value={form.whatsapp_number || ''} onChange={update} error={fieldErrors.whatsapp_number} placeholder="41791234567" inputMode="numeric" />
              <label>WhatsApp-Standardtext<textarea name="whatsapp_message" rows="4" value={form.whatsapp_message || ''} onChange={update} required className={fieldErrors.whatsapp_message ? 'is-invalid' : ''} />{fieldErrors.whatsapp_message && <small className="field-error">{fieldErrors.whatsapp_message}</small>}</label>
              <SettingField label="Benachrichtigungs-E-Mail" type="email" name="notification_email" value={form.notification_email || ''} onChange={update} error={fieldErrors.notification_email} placeholder="info@sentinator.li" />

              <div className="settings-divider"><span>Tracking &amp; Meta Pixel</span></div>
              <label className="admin-checkbox"><input type="checkbox" name="meta_pixel_enabled" checked={Boolean(form.meta_pixel_enabled)} onChange={update} /><span>Meta Pixel nach Marketing-Einwilligung aktivieren</span></label>
              <SettingField label="Meta Pixel-ID" name="meta_pixel_id" value={form.meta_pixel_id || ''} onChange={update} error={fieldErrors.meta_pixel_id} placeholder="123456789012345" inputMode="numeric" pattern="[0-9]*" disabled={!form.meta_pixel_enabled} />
              <p className="admin-field-note">Der Pixel lädt erst, nachdem eine Besucherin im Cookie-Banner „Marketing akzeptieren“ gewählt hat. PageView, ViewContent, Contact und Lead sind im Frontend vorbereitet.</p>

              <div className="settings-divider"><span>Formular</span></div>
              <label className="admin-checkbox"><input type="checkbox" name="form_enabled" checked={Boolean(form.form_enabled)} onChange={update} /><span>Anfrageformular aktiv</span></label>
              <div className="admin-form__actions"><button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>{saving ? 'Wird gespeichert …' : 'Einstellungen speichern'}</button></div>
            </form>
          </section>
          <aside className="settings-help">
            <h2>Wichtig vor dem Livegang</h2>
            <p>Das freigegebene Design bleibt erhalten. Preiswerte werden automatisch an allen relevanten Stellen der Landingpage aktualisiert.</p>
            <ul>
              <li>SMTP-Zugangsdaten bleiben ausschließlich in <code>.env</code>.</li>
              <li>Die WhatsApp-Nummer im internationalen Format ohne Pluszeichen eintragen.</li>
              <li>Die Zeitzone bleibt auf <code>Europe/Zurich</code>.</li>
              <li>„Zeitraum erzwingen“ erst nach Abschluss aller Tests aktivieren.</li>
              <li>Vor größeren Änderungen mit <code>npm run backup</code> ein Backup erstellen.</li>
              <li>Impressum und Datenschutzerklärung enthalten die Betreiberangaben der Sentinator GmbH und sollten vor Veröffentlichung rechtlich geprüft werden.</li>
              <li>Die Meta Pixel-ID findest du im Meta Events Manager. Nach dem Speichern Einwilligung, PageView, ViewContent, Contact und Lead im Bereich „Test-Events“ prüfen.</li>
            </ul>
            <a className="admin-btn admin-btn--light admin-btn--wide-link" href={downloadUrl('/api/admin/backup.json')}>Geschütztes JSON-Backup herunterladen</a>
            {database && (
              <div className="database-status-card">
                <div className="database-status-card__head"><span className="database-dot" /> <strong>Datenbank verbunden</strong></div>
                <dl>
                  <div><dt>Engine</dt><dd>{database.engine}</dd></div>
                  <div><dt>Datenbank</dt><dd>{database.databaseName || '–'}</dd></div>
                  <div><dt>Größe</dt><dd>{formatBytes(database.sizeBytes)}</dd></div>
                  <div><dt>Migrationen</dt><dd>{database.migrations?.filter((item) => item.applied && item.checksumValid).length || 0}/{database.migrations?.length || 0}</dd></div>
                  <div><dt>Pool</dt><dd>{database.pool?.total || 0} Verbindungen</dd></div>
                </dl>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function SettingField({ label, error, ...props }) {
  return <label>{label}<input {...props} className={error ? 'is-invalid' : ''} />{error && <small className="field-error">{error}</small>}</label>;
}

function toInput(value) {
  return value ? String(value).slice(0, 16) : '';
}

function normalizeResponse(settings) {
  return {
    ...settings,
    campaign_enforce: String(settings.campaign_enforce) === 'true' || settings.campaign_enforce === true,
    meta_pixel_enabled: String(settings.meta_pixel_enabled) === 'true' || settings.meta_pixel_enabled === true,
    form_enabled: String(settings.form_enabled) !== 'false' && settings.form_enabled !== false,
    single_price_chf: Number(settings.single_price_chf || 550),
    besties_price_chf: Number(settings.besties_price_chf || 990)
  };
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}


function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!bytes) return '0 MB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / (1024 ** index)).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
}
