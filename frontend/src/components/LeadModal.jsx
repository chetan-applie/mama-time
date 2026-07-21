import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { apiFetch } from '../lib/api.js';
import { persistAttribution, trackEvent, useWhatsappUrl } from '../lib/campaign.js';

const emptyForm = {
  first_name: '', last_name: '', email: '', phone: '',
  bestie_first_name: '', bestie_last_name: '', bestie_email: '', bestie_phone: '',
  preferred_contact: '', start_preference: '', message: '', privacy: false, website: ''
};

function clientValidate(form, offerType) {
  const errors = {};
  if (!form.first_name.trim()) errors.first_name = 'Bitte gib deinen Vornamen ein.';
  if (!form.last_name.trim()) errors.last_name = 'Bitte gib deinen Nachnamen ein.';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Bitte gib eine gültige E-Mail-Adresse ein.';
  if (form.phone.replace(/\D/g, '').length < 7) errors.phone = 'Bitte gib eine gültige Mobilnummer ein.';
  if (offerType === 'besties') {
    if (!form.bestie_first_name.trim()) errors.bestie_first_name = 'Bitte gib den Vornamen deiner Bestie ein.';
    if (!form.bestie_last_name.trim()) errors.bestie_last_name = 'Bitte gib den Nachnamen deiner Bestie ein.';
    if (form.bestie_email && !/^\S+@\S+\.\S+$/.test(form.bestie_email.trim())) errors.bestie_email = 'Bitte prüfe die E-Mail-Adresse.';
  }
  if (!form.preferred_contact) errors.preferred_contact = 'Bitte wähle eine Kontaktart.';
  if (!form.start_preference) errors.start_preference = 'Bitte wähle deinen Startwunsch.';
  if (!form.privacy) errors.privacy = 'Bitte bestätige die Datenschutzerklärung.';
  return errors;
}

export default function LeadModal({ open, initialOffer, campaign, onClose }) {
  const dialogRef = useRef(null);
  const firstInputRef = useRef(null);
  const [offerType, setOfferType] = useState(initialOffer || 'single');
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [startedAt, setStartedAt] = useState(Date.now());
  const whatsappUrl = useWhatsappUrl(campaign);
  const offerSummary = offerType === 'besties'
    ? `2 Mamas / Besties · CHF ${campaign.bestiesPriceChf}.–`
    : `1 Mama · CHF ${campaign.singlePriceChf}.–`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setOfferType(initialOffer || 'single');
    setForm(emptyForm);
    setErrors({});
    setGeneralError('');
    setSuccess(null);
    setSubmitting(false);
    setStartedAt(Date.now());
    document.body.classList.add('dialog-open');
    window.setTimeout(() => firstInputRef.current?.focus(), 80);
    trackEvent('mama_time_form_open', { offer_type: initialOffer || 'single' });
    return () => document.body.classList.remove('dialog-open');
  }, [open, initialOffer]);

  const disabled = campaign.formEnabled === false || (campaign.campaignEnforce && campaign.campaignStatus !== 'active');

  const attribution = useMemo(() => open ? persistAttribution() : {}, [open]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setGeneralError('');
  };

  const close = () => {
    if (!submitting) onClose();
  };

  const submit = async (event) => {
    event.preventDefault();
    const validation = clientValidate(form, offerType);
    if (Object.keys(validation).length) {
      setErrors(validation);
      setGeneralError('Bitte prüfe die markierten Felder.');
      const firstName = Object.keys(validation)[0];
      document.querySelector(`[name="${firstName}"]`)?.focus();
      return;
    }
    setSubmitting(true);
    setGeneralError('');
    try {
      const payload = {
        ...form,
        ...attribution,
        offer_type: offerType,
        privacy: form.privacy ? 1 : 0,
        form_started_at: startedAt,
        landing_url: window.location.href.slice(0, 1000),
        referrer: document.referrer.slice(0, 1000),
        page_variant: 'react-responsive',
        screen: `${window.screen.width}x${window.screen.height}`
      };
      const result = await apiFetch('/api/public/leads', { method: 'POST', body: JSON.stringify(payload) });
      setSuccess(result);
      trackEvent('mama_time_form_submit', {
        content_name: 'MAMA TIME 2026',
        content_category: 'Daytime Training',
        offer_type: offerType,
        value: offerType === 'besties' ? campaign.bestiesPriceChf : campaign.singlePriceChf,
        currency: 'CHF'
      });
    } catch (error) {
      setErrors(error.fields || {});
      setGeneralError(error.message || 'Die Anfrage konnte nicht gesendet werden.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="lead-dialog"
      aria-labelledby="lead-title"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === dialogRef.current && window.innerWidth >= 768) close(); }}
    >
      <div className="lead-dialog__panel">
        <button className="dialog-close" type="button" aria-label="Formular schliessen" onClick={close}><Icon name="close" /></button>
        {!success ? (
          <>
            <div className="lead-dialog__head">
              <p className="eyebrow">MAMA TIME</p>
              <h2 id="lead-title">Jetzt MAMA TIME Platz sichern</h2>
              <p>Wähle dein Angebot und sende uns deine Anfrage. Das Sentinators-Team meldet sich zur Bestätigung bei dir.</p>
            </div>
            <form id="lead-form" noValidate onSubmit={submit}>
              <label className="hp-field" aria-hidden="true">Website<input name="website" tabIndex="-1" autoComplete="off" value={form.website} onChange={update} /></label>
              <fieldset className="offer-choice">
                <legend>Angebot wählen</legend>
                <label><input type="radio" name="offer_type" value="single" checked={offerType === 'single'} onChange={() => setOfferType('single')} /><span><strong>1 Mama</strong><small>CHF {campaign.singlePriceChf}.– inkl. Membercard</small></span></label>
                <label className="offer-choice__featured"><input type="radio" name="offer_type" value="besties" checked={offerType === 'besties'} onChange={() => setOfferType('besties')} /><span><strong>2 Mamas / Besties</strong><small>CHF {campaign.bestiesPriceChf}.– inkl. 2 Membercards</small></span></label>
              </fieldset>
              <div className="form-grid">
                <Field label="Vorname*" name="first_name" value={form.first_name} onChange={update} error={errors.first_name} inputRef={firstInputRef} autoComplete="given-name" maxLength="80" />
                <Field label="Nachname*" name="last_name" value={form.last_name} onChange={update} error={errors.last_name} autoComplete="family-name" maxLength="80" />
                <Field label="E-Mail-Adresse*" type="email" name="email" value={form.email} onChange={update} error={errors.email} autoComplete="email" maxLength="180" />
                <Field label="Mobilnummer*" type="tel" name="phone" value={form.phone} onChange={update} error={errors.phone} autoComplete="tel" inputMode="tel" maxLength="50" placeholder="+41 79 123 45 67" />
                {offerType === 'besties' && (
                  <div className="bestie-fields form-grid__full">
                    <div className="bestie-fields__heading"><span>Angaben deiner Mama-Bestie</span><small>für das Angebot zu zweit</small></div>
                    <div className="form-grid form-grid--nested">
                      <Field label="Vorname der Bestie*" name="bestie_first_name" value={form.bestie_first_name} onChange={update} error={errors.bestie_first_name} maxLength="80" />
                      <Field label="Nachname der Bestie*" name="bestie_last_name" value={form.bestie_last_name} onChange={update} error={errors.bestie_last_name} maxLength="80" />
                      <Field label="E-Mail der Bestie" type="email" name="bestie_email" value={form.bestie_email} onChange={update} error={errors.bestie_email} maxLength="180" />
                      <Field label="Mobilnummer der Bestie" type="tel" name="bestie_phone" value={form.bestie_phone} onChange={update} error={errors.bestie_phone} inputMode="tel" maxLength="50" />
                    </div>
                  </div>
                )}
                <label className="form-grid__full"><span>Wie dürfen wir dich am liebsten kontaktieren?*</span><select name="preferred_contact" value={form.preferred_contact} onChange={update} className={errors.preferred_contact ? 'is-invalid' : ''}><option value="">Bitte wählen</option><option value="Telefon">Telefon</option><option value="WhatsApp">WhatsApp</option><option value="E-Mail">E-Mail</option></select>{errors.preferred_contact && <small className="field-message">{errors.preferred_contact}</small>}</label>
                <label className="form-grid__full"><span>Wann möchtest du starten?*</span><select name="start_preference" value={form.start_preference} onChange={update} className={errors.start_preference ? 'is-invalid' : ''}><option value="">Bitte wählen</option><option value="Direkt nach den Schulferien">Direkt nach den Schulferien</option><option value="Im August 2026">Im August 2026</option><option value="Im September 2026">Im September 2026</option><option value="Noch offen">Ich bin noch unsicher</option></select>{errors.start_preference && <small className="field-message">{errors.start_preference}</small>}</label>
                <label className="form-grid__full"><span>Hast du noch eine Frage? <small>(optional)</small></span><textarea name="message" value={form.message} onChange={update} maxLength="2000" rows="3" /></label>
              </div>
              <label className="consent"><input type="checkbox" name="privacy" checked={form.privacy} onChange={update} className={errors.privacy ? 'is-invalid' : ''} /><span>Ich habe die <a href="/datenschutz" target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen. Meine Angaben dürfen zur Bearbeitung dieser Anfrage verwendet werden.*{errors.privacy && <small className="field-message">{errors.privacy}</small>}</span></label>
              <div className="form-summary" aria-live="polite"><span>Ausgewähltes Angebot</span><strong>{offerSummary}</strong></div>
              {generalError && <p className="form-error" role="alert">{generalError}</p>}
              <button className={`btn btn--primary btn--wide submit-button${submitting ? ' is-loading' : ''}`} type="submit" disabled={submitting || disabled}>{submitting ? 'Anfrage wird gesendet …' : disabled ? 'Aktion momentan nicht verfügbar' : <>Anfrage senden und Platz sichern <Icon name="arrow" /></>}</button>
              <p className="form-note">Mit dem Absenden entsteht noch kein kostenpflichtiger Vertrag. Das Gym bestätigt Verfügbarkeit, Startdatum und Bedingungen persönlich.</p>
            </form>
          </>
        ) : (
          <div className="form-success" aria-live="polite">
            <span className="success-icon"><Icon name="check" /></span>
            <h2>Danke! Deine Anfrage ist eingegangen.</h2>
            <p>Deine Referenznummer lautet <strong>{success.reference}</strong>. Wir melden uns so schnell wie möglich bei dir.</p>
            {success.duplicate && <p>Wir haben bereits eine ähnliche Anfrage gefunden und führen beide Einträge im Backoffice zusammen.</p>}
            <div className="success-actions"><button className="btn btn--primary" type="button" onClick={close}>Schliessen</button>{whatsappUrl && <a className="btn btn--whatsapp" href={whatsappUrl} target="_blank" rel="noopener" onClick={() => trackEvent('mama_time_whatsapp_click', { content_name: 'MAMA TIME 2026', content_category: 'Daytime Training', contact_method: 'whatsapp' })}><Icon name="whatsapp" />WhatsApp öffnen</a>}</div>
          </div>
        )}
      </div>
    </dialog>
  );
}

function Field({ label, error, inputRef, ...props }) {
  return (
    <label><span>{label}</span><input ref={inputRef} {...props} className={error ? 'is-invalid' : ''} />{error && <small className="field-message">{error}</small>}</label>
  );
}
