import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getMarketingConsent,
  OPEN_COOKIE_SETTINGS_EVENT,
  setMarketingConsent
} from '../lib/metaPixel.js';

export default function CookieConsent({ enabled }) {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(() => getMarketingConsent());

  useEffect(() => {
    if (!enabled) {
      setOpen(false);
      return;
    }
    if (consent === null) setOpen(true);
  }, [enabled, consent]);

  useEffect(() => {
    const reopen = () => setOpen(Boolean(enabled));
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, [enabled]);

  if (!enabled || !open) return null;

  const choose = (granted) => {
    setMarketingConsent(granted);
    setConsent(granted);
    setOpen(false);
  };

  return (
    <aside className="cookie-consent" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
      <div className="cookie-consent__card">
        <div className="cookie-consent__copy">
          <p className="cookie-consent__eyebrow">DEINE DATEN · DEINE WAHL</p>
          <h2 id="cookie-title">Cookie-Einstellungen</h2>
          <p>
            Notwendige Funktionen laufen immer. Mit deiner Zustimmung aktivieren wir den Meta Pixel,
            um Seitenaufrufe, WhatsApp-Klicks und erfolgreiche MAMA-TIME-Anfragen zu messen.
            Namen, E-Mail-Adressen und Telefonnummern werden dabei nicht als Pixel-Event übertragen.
          </p>
          <Link to="/datenschutz">Mehr zum Datenschutz</Link>
        </div>
        <div className="cookie-consent__actions">
          <button className="btn btn--outline cookie-consent__necessary" type="button" onClick={() => choose(false)}>
            Nur notwendige
          </button>
          <button className="btn btn--primary" type="button" onClick={() => choose(true)}>
            Marketing akzeptieren
          </button>
        </div>
      </div>
    </aside>
  );
}
