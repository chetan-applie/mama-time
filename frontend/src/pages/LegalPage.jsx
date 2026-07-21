import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { openCookieSettings } from '../lib/metaPixel.js';

const OPERATOR = {
  name: 'Sentinator GmbH',
  street: 'Hauptstrasse 11',
  postalCity: '9476 Weite',
  country: 'Schweiz',
  email: 'info@sentinator.li'
};

export default function LegalPage({ type, trackingEnabled = false }) {
  useEffect(() => {
    document.body.className = 'campaign mama-time';
    document.documentElement.lang = 'de-CH';
    return () => { document.body.className = ''; };
  }, []);

  const privacy = type === 'privacy';

  return (
    <div className="legal-page">
      <header className="legal-page__header">
        <div className="page-shell">
          <div className="brand"><strong>SENTINATORS GYM</strong><span>WEITE SG</span></div>
        </div>
      </header>
      <main className="page-shell legal-page__content">
        <Link className="admin-link" to="/">← Zurück zur Landingpage</Link>
        <h1>{privacy ? 'Datenschutzerklärung' : 'Impressum'}</h1>
        {privacy
          ? <PrivacyContent trackingEnabled={trackingEnabled} />
          : <ImprintContent />}
      </main>
    </div>
  );
}

function CompanyAddress() {
  return (
    <address className="legal-address">
      <strong>{OPERATOR.name}</strong><br />
      {OPERATOR.street}<br />
      {OPERATOR.postalCity}<br />
      {OPERATOR.country}<br /><br />
      E-Mail: <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
    </address>
  );
}

function ImprintContent() {
  return (
    <>
      <h2>Betreiberin der Website</h2>
      <CompanyAddress />

      <h2>Verantwortung für den Inhalt</h2>
      <p>{OPERATOR.name} ist für die Inhalte dieser Website und der MAMA-TIME-Kampagne verantwortlich.</p>

      <h2>Haftungshinweis</h2>
      <p>Die Inhalte dieser Website werden mit Sorgfalt erstellt und laufend geprüft. Trotz sorgfältiger Bearbeitung kann keine Gewähr für Vollständigkeit, Richtigkeit und dauerhafte Verfügbarkeit übernommen werden. Verbindlich sind die individuell bestätigten Vertrags- und Angebotsbedingungen.</p>

      <h2>Urheberrecht</h2>
      <p>Texte, Gestaltung, Bilder, Videos und sonstige Inhalte dieser Website sind urheberrechtlich geschützt. Eine Verwendung ausserhalb der gesetzlich zulässigen Grenzen bedarf der vorherigen Zustimmung der Rechteinhaberin.</p>

      <h2>Kontakt</h2>
      <p>Fragen zur Website oder zur MAMA-TIME-Aktion können per E-Mail an <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a> gerichtet werden.</p>
    </>
  );
}

function PrivacyContent({ trackingEnabled }) {
  return (
    <>
      <h2>Verantwortliche Stelle</h2>
      <CompanyAddress />

      <h2>Gegenstand dieser Datenschutzerklärung</h2>
      <p>Diese Datenschutzerklärung beschreibt, wie personenbezogene Daten beim Besuch dieser Website, bei einer MAMA-TIME-Anfrage und bei der Nutzung der angebotenen Kontaktmöglichkeiten bearbeitet werden.</p>

      <h2>Technische Zugriffsdaten</h2>
      <p>Beim Aufruf der Website können technisch erforderliche Informationen wie Zeitpunkt, aufgerufene Seite, Browser- und Geräteinformationen sowie Sicherheits- und Serverdaten verarbeitet werden. Für Sicherheits- und Duplikatprüfungen kann eine nicht rückrechenbare, mit einem geheimen Schlüssel erzeugte IP-Prüfsumme gespeichert werden; die vollständige IP-Adresse wird nicht als Lead-Feld gespeichert.</p>

      <h2>Formularanfragen und PostgreSQL-Datenbank</h2>
      <p>Beim Absenden des MAMA-TIME-Formulars werden die eingegebenen Kontakt-, Angebots- und Bestie-Daten, Kontaktwunsch, Startpräferenz, optionale Nachricht sowie der Zeitpunkt der Datenschutzeinwilligung gespeichert. Die Daten werden in einer geschützten PostgreSQL-Datenbank verarbeitet, damit die Anfrage bearbeitet, persönlich beantwortet und im Backoffice dokumentiert werden kann.</p>
      <p>Zusätzlich können Kampagneninformationen wie UTM-Parameter, Referrer, Landingpage-URL, Bildschirmgrösse sowie Facebook- oder Google-Klickkennungen gespeichert werden. Diese Angaben dienen der technischen Zuordnung, der Kampagnenauswertung und der Vermeidung mehrfacher Einträge.</p>

      <h2>E-Mail und WhatsApp</h2>
      <p>Bei einer Kontaktaufnahme per E-Mail werden die übermittelten Angaben zur Bearbeitung der Anfrage verwendet. Beim Öffnen eines WhatsApp-Links wird die Website verlassen; die weitere Datenbearbeitung erfolgt nach den Bedingungen des jeweiligen WhatsApp-Dienstes. Eine Nachricht wird erst übermittelt, wenn sie in WhatsApp tatsächlich gesendet wird.</p>

      <h2>Meta Pixel und Marketing-Einwilligung</h2>
      <p>Der Meta Pixel wird nur geladen, wenn im Cookie-Banner ausdrücklich „Marketing akzeptieren“ gewählt wurde und im Backoffice eine gültige Pixel-ID aktiviert ist. Ohne diese Einwilligung wird das externe Meta-Skript nicht geladen. Im geschützten Backoffice wird der Pixel nicht initialisiert.</p>
      <p>Nach erteilter Zustimmung können folgende Ereignisse gemessen werden: ein Seitenaufruf (<code>PageView</code>), der Aufruf der MAMA-TIME-Landingpage (<code>ViewContent</code>), ein WhatsApp-Klick (<code>Contact</code>) und eine erfolgreich in der Datenbank gespeicherte Formularanfrage (<code>Lead</code>).</p>
      <p>Die Frontend-Integration übermittelt dabei keine Namen, E-Mail-Adressen, Telefonnummern, Nachrichten, Bestie-Kontaktdaten oder internen Lead-Referenzen als Pixel-Eventparameter. Übermittelt werden nur neutrale Angaben wie Angebotsart, Kontaktmethode, Kampagnenbezeichnung, Währung und Angebotswert.</p>
      <p>Bei aktivem Meta Pixel können Daten an Meta übermittelt und auch ausserhalb der Schweiz verarbeitet werden. Die Einwilligung kann jederzeit über die Cookie-Einstellungen geändert oder widerrufen werden. Beim Widerruf wird die Zustimmung gegenüber dem Pixel widerrufen und es wird versucht, die zugehörigen First-Party-Cookies <code>_fbp</code> und <code>_fbc</code> zu löschen.</p>
      {trackingEnabled ? <button className="cookie-settings-inline" type="button" onClick={openCookieSettings}>Cookie-Einstellungen öffnen</button> : null}

      <h2>Cookie- und Einwilligungsspeicherung</h2>
      <p>Die Entscheidung für oder gegen Marketing wird lokal im Browser gespeichert, damit das Banner nicht bei jedem Seitenaufruf erneut erscheint. Notwendige Funktionen der Website, das Anfrageformular und das Backoffice bleiben unabhängig von einer Marketing-Einwilligung nutzbar.</p>

      <h2>Aufbewahrung</h2>
      <p>Personenbezogene Daten werden nur so lange aufbewahrt, wie dies für die Bearbeitung der Anfrage, die Kundenkommunikation, den Nachweis von Vorgängen, die Systemsicherheit und gesetzliche Pflichten erforderlich ist. Nicht mehr benötigte Daten werden gelöscht oder anonymisiert. Testanfragen sollen vor dem Kampagnenstart entfernt werden.</p>

      <h2>Datensicherheit</h2>
      <p>Die Anwendung verwendet technische und organisatorische Schutzmassnahmen, darunter HTTPS im Produktivbetrieb, geschützte Administrationszugänge, Zugriffskontrollen, sichere Passwörter, CSRF-Schutz, Rate-Limits, Backups und eine getrennte PostgreSQL-Datenbank.</p>

      <h2>Rechte betroffener Personen</h2>
      <p>Betroffene Personen können im Rahmen des anwendbaren Datenschutzrechts Auskunft, Berichtigung, Löschung oder Einschränkung der Bearbeitung verlangen sowie einer Bearbeitung widersprechen. Anfragen sind an <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a> zu richten. Zur Vermeidung unberechtigter Auskünfte kann ein Identitätsnachweis verlangt werden.</p>

      <h2>Änderungen</h2>
      <p>Diese Datenschutzerklärung kann angepasst werden, wenn Funktionen, Dienstleister oder rechtliche Anforderungen geändert werden. Es gilt die jeweils auf dieser Website veröffentlichte Fassung.</p>
    </>
  );
}
