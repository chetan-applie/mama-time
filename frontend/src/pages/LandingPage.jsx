import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import LeadModal from '../components/LeadModal.jsx';
import { trackEvent, useWhatsappUrl } from '../lib/campaign.js';
import { openCookieSettings } from '../lib/metaPixel.js';


export default function LandingPage({ campaign }) {
  const whatsappUrl = useWhatsappUrl(campaign);
  const [modal, setModal] = useState({ open: false, offer: 'single' });
  const [openFaq, setOpenFaq] = useState(null);
  const campaignDates = useMemo(() => formatCampaignDates(campaign), [campaign.campaignStart, campaign.campaignEnd, campaign.campaignTimezone]);
  const faqs = useMemo(() => createFaqs(campaign, campaignDates), [campaign, campaignDates]);

  useEffect(() => {
    document.body.className = 'campaign mama-time build-mobile';
    document.body.dataset.campaignStatus = campaign.campaignStatus || 'active';
    document.documentElement.lang = 'de-CH';
    return () => { document.body.className = ''; delete document.body.dataset.campaignStatus; };
  }, [campaign.campaignStatus]);

  useEffect(() => {
    trackEvent('mama_time_landing_view', {
      content_name: 'MAMA TIME 2026',
      content_category: 'Daytime Training'
    });
  }, [campaign.metaPixelEnabled, campaign.metaPixelId]);

  const openForm = (offer) => {
    if (campaign.formEnabled === false || (campaign.campaignEnforce && campaign.campaignStatus !== 'active')) return;
    setModal({ open: true, offer });
  };
  const whatsapp = (event) => {
    if (!whatsappUrl) {
      event.preventDefault();
      openForm('single');
      return;
    }
    trackEvent('mama_time_whatsapp_click', {
      content_name: 'MAMA TIME 2026',
      content_category: 'Daytime Training',
      contact_method: 'whatsapp'
    });
  };
  const inactive = campaign.formEnabled === false || (campaign.campaignEnforce && campaign.campaignStatus !== 'active');

  return (
    <>
      <a className="skip-link" href="#main">Zum Inhalt springen</a>
      {campaign.campaignEnforce && campaign.campaignStatus !== 'active' && (
        <div className={`campaign-notice campaign-notice--${campaign.campaignStatus}`}>
          {campaign.campaignStatus === 'scheduled' ? `Die MAMA TIME Aktion startet am ${campaignDates.startLong}.` : `Die MAMA TIME Aktion ist seit dem ${campaignDates.endLong} beendet.`}
        </div>
      )}
      <header id="hero" className="hero">
        <div className="hero__glow hero__glow--one" />
        <div className="hero__glow hero__glow--two" />
        <div className="hero__inner page-shell">
          <div className="brand" aria-label="Sentinators Gym, Weite SG"><strong>SENTINATORS GYM</strong><span>WEITE SG</span></div>
          <div className="hero__media" aria-hidden="true">
            <picture><source media="(max-width: 767px)" srcSet="/assets/hero-mamas-mobile.webp" /><img src="/assets/hero-mamas-desktop.webp" alt="" width="810" height="1085" fetchPriority="high" /></picture>
            <div className="hero__media-fade" />
          </div>
          <div className="hero__copy">
            <p className="eyebrow">SENTINATORS GYM PRESENTS</p>
            <h1>MAMA <span>TIME</span></h1>
            <p className="hero__claim">Die Kinder sind wieder in der Schule.<br /><strong>Jetzt bist du dran.</strong></p>
            <p className="hero__intro">Sichere dir jetzt dein Daytime-Abo im Sentinators Gym und starte nach den Schulferien mit neuer Energie, mehr Zeit für dich und einem klaren Fokus auf deine Gesundheit.</p>
            <ul className="check-list" aria-label="Vorteile">
              {['12 Monate Daytime-Training','Ideal morgens, über Mittag und nachmittags','Perfekt für Mütter mit Kindern in Schule oder Kindergarten','Jetzt sichern, später starten'].map((item) => <li key={item}><span className="check-dot"><Icon name="check" /></span>{item}</li>)}
            </ul>
            <div className="hero__actions">
              <button className="btn btn--primary" type="button" onClick={() => openForm('single')} disabled={inactive}>Jetzt Platz sichern <Icon name="arrow" /></button>
              <button className="btn btn--outline" type="button" onClick={() => openForm('besties')} disabled={inactive}>Mit Bestie anmelden <Icon name="heart" /></button>
              <a className="btn btn--whatsapp" href={whatsappUrl || '#'} target={whatsappUrl ? '_blank' : undefined} rel="noopener" onClick={whatsapp}><Icon name="whatsapp" />Direkt via WhatsApp</a>
            </div>
            <div className="hero__meta"><div><Icon name="calendar" /><span>Nur vom {campaignDates.startShort}<br />bis {campaignDates.endShort}</span></div><div><Icon name="users" /><span>Limitierte Plätze<br />verfügbar</span></div></div>
          </div>
          <div className="hero__offers" aria-label="Angebote">
            <article className="mini-offer mini-offer--single"><span className="mini-offer__icon"><Icon name="user" /></span><p className="mini-offer__label">1 MAMA</p><p className="mini-offer__price">CHF {campaign.singlePriceChf}.–</p><p className="mini-offer__per">pro Mama</p><span className="pill pill--gold">INKL. MEMBERCARD</span></article>
            <article className="mini-offer mini-offer--besties"><span className="saving-badge">{campaign.savingsPercent}%<small>SPAREN</small></span><span className="mini-offer__icon"><Icon name="heart" /></span><p className="mini-offer__label">MIT DEINER<br />MAMA-BESTIE</p><p className="mini-offer__price">CHF {campaign.bestiesPriceChf}.–</p><p className="mini-offer__per">für beide</p><p className="mini-offer__was">statt CHF {campaign.singlePriceChf * 2}.–</p><p className="mini-offer__save">Beide sparen {campaign.savingsPercent} %</p><span className="pill pill--gold">INKL. 2 MEMBERCARDS</span><strong className="mini-offer__bottom">Nur CHF {campaign.bestiesPerPersonChf}.– pro Mama</strong></article>
          </div>
        </div>
      </header>

      <main id="main">
        <section id="why" className="section section--ivory"><div className="page-shell"><Heading>WARUM <span>MAMA TIME?</span></Heading><div className="benefit-grid">
          <Benefit icon="bag">TRAINIERE, WENN DEINE KINDER BESTENS BETREUT SIND.</Benefit><Benefit icon="sun">NUTZE DEINEN MORGEN ODER DEN TAG FÜR DICH.</Benefit><Benefit icon="clock">KEIN ABENDLICHER STRESS ZU HAUPTZEITEN.</Benefit><Benefit icon="heart">MEHR ENERGIE, MEHR ICH-ZEIT, MEHR WOHLBEFINDEN.</Benefit><Benefit icon="star">MOTIVIERENDE ATMOSPHÄRE IM SENTINATORS GYM.</Benefit>
        </div></div></section>

        <section id="audience" className="audience"><div className="audience__media"><img src="/assets/audience-mama.webp" alt="Mutter mit einer Tasse am Fenster" width="425" height="443" loading="lazy" /></div><div className="audience__content page-shell"><div className="audience__copy"><h2>FÜR WEN IST DAS ANGEBOT GEDACHT?</h2><p>Für Mütter, die nach den Ferien wieder durchstarten wollen – mit einem Angebot, das perfekt in ihren Alltag passt.</p><div className="audience-grid">
          <Audience icon="heart">Du willst nach der Ferienzeit wieder in eine <strong>gesunde Routine</strong> finden.</Audience><Audience icon="clock">Du trainierst lieber <strong>morgens, über Mittag oder am Nachmittag</strong> als am Abend.</Audience><Audience icon="dumbbell">Du möchtest dich <strong>fitter, stärker und energievoller</strong> fühlen.</Audience><Audience icon="crown">Du willst in einem <strong>Premium Gym</strong> trainieren – statt allein zuhause.</Audience>
        </div></div></div></section>

        <section id="offers" className="section section--light"><div className="page-shell page-shell--narrow"><Heading>ANGEBOTSVERGLEICH</Heading><div className="pricing-grid">
          <article className="price-card price-card--single"><div className="price-card__icon"><Icon name="user" /></div><p className="price-card__label">1 MAMA</p><data className="price-card__price" value={campaign.singlePriceChf}>CHF {campaign.singlePriceChf}.–</data><p className="price-card__per">pro Mama</p><span className="pill pill--gold">INKL. MEMBERCARD</span><ul className="price-features">{['12 Monate Daytime-Training','Zugang zu allen Daytime-Zeiten','Moderne Geräte & Premium Betreuung','Jetzt sichern, später starten'].map((item) => <li key={item}><span><Icon name="check" /></span>{item}</li>)}</ul><button className="btn btn--primary btn--wide" type="button" onClick={() => openForm('single')} disabled={inactive}>Jetzt Platz sichern <Icon name="arrow" /></button></article>
          <article className="price-card price-card--besties"><span className="ribbon"><Icon name="star" />BELIEBTESTE WAHL</span><div className="price-card__icon"><Icon name="users" /></div><p className="price-card__label">2 MAMAS / BESTIES</p><data className="price-card__price" value={campaign.bestiesPriceChf}>CHF {campaign.bestiesPriceChf}.–</data><p className="price-card__per">für beide</p><p className="price-card__was">statt <s>CHF {campaign.singlePriceChf * 2}.–</s></p><span className="pill pill--gold pill--wide">BEIDE SPAREN {campaign.savingsPercent} %</span><span className="pill pill--white">INKL. 2 MEMBERCARDS</span><strong className="price-card__per-person">Nur CHF {campaign.bestiesPerPersonChf}.– pro Mama</strong><button className="btn btn--rose-dark btn--wide" type="button" onClick={() => openForm('besties')} disabled={inactive}>Mit Bestie anmelden <Icon name="heart" /></button></article>
        </div></div></section>

        <section id="steps" className="section section--ivory steps"><div className="page-shell"><Heading>SO FUNKTIONIERT’S</Heading><ol className="step-grid"><Step no="1" icon="clipboard" title="ANGEBOT WÄHLEN">Entscheide dich für 1 Mama oder 2 Mamas.</Step><Step no="2" icon="shield" title="PLATZ SICHERN">Anmelden und deinen Platz sichern.</Step><Step no="3" icon="calendar" title="NACH DEN SCHULFERIEN STARTEN">Starte flexibel nach den Schulferien.</Step><Step no="4" icon="heart" title="GEMEINSAM DURCHZIEHEN">Bleib dran und erreich deine Ziele.</Step></ol></div></section>

        <section id="trust" className="section trust-section"><div className="page-shell trust-layout"><div className="trust-main"><Heading left>WARUM SENTINATORS GYM?</Heading><div className="trust-grid"><Trust icon="pin" title="MODERNES PREMIUM GYM IN WEITE SG">Top ausgestattet und zentral.</Trust><Trust icon="heart" title="MOTIVIERENDE ATMOSPHÄRE">Wertschätzend, unterstützend, inspirierend.</Trust><Trust icon="dumbbell" title="HOCHWERTIGES TRAINING">Professionelle Betreuung, saubere Geräte, beste Qualität.</Trust><Trust icon="sun" title="IDEAL FÜR DAYTIME-TRAINING">Viele ruhige Zeiten für dein Training unter der Woche.</Trust></div></div><aside className="social-proof" aria-label="Community-Vorteil"><span className="community-badge">MAMA TIME COMMUNITY</span><h2>GEMEINSAM FÄLLT DER START LEICHTER</h2><Community icon="heart">Teile dein Ziel mit deiner Mama-Bestie und startet mit einem klaren gemeinsamen Plan.</Community><Community icon="users">Ihr erhaltet zwei persönliche Mitgliedschaften und könnt gemeinsam oder unabhängig trainieren.</Community><Community icon="star">Das Besties-Angebot ist die beliebteste Wahl und spart euch zusammen CHF {campaign.savingsChf}.–.</Community></aside></div></section>

        <section id="faq" className="faq-section"><div className="page-shell page-shell--narrow"><Heading dark>HÄUFIGE FRAGEN</Heading><div className="faq-grid"><div className="faq-col">{faqs.slice(0,4).map((item, i) => <Faq key={item[0]} item={item} index={i} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />)}</div><div className="faq-col">{faqs.slice(4).map((item, i) => <Faq key={item[0]} item={item} index={i+4} open={openFaq === i+4} onToggle={() => setOpenFaq(openFaq === i+4 ? null : i+4)} />)}</div></div></div></section>

        <section id="final-cta" className="final-cta"><div className="page-shell final-cta__inner"><div className="final-cta__copy"><h2>SICHERE DIR JETZT<br />DEINEN PLATZ</h2><p>Die Aktion läuft nur bis zum {campaignDates.endLong}. Sichere dir jetzt dein MAMA TIME Angebot und starte nach den Schulferien.</p></div><div className="final-cta__actions"><button className="btn btn--primary" type="button" onClick={() => openForm('single')} disabled={inactive}>Jetzt Platz sichern <Icon name="arrow" /></button><button className="btn btn--outline-light" type="button" onClick={() => openForm('besties')} disabled={inactive}>Mit Bestie anmelden <Icon name="heart" /></button><a className="btn btn--whatsapp" href={whatsappUrl || '#'} target={whatsappUrl ? '_blank' : undefined} rel="noopener" onClick={whatsapp}><Icon name="whatsapp" />WhatsApp Anfrage senden</a></div><div className="deadline-badge">NUR BIS<strong>{campaignDates.endShort}</strong></div></div></section>
      </main>

      <footer className="legal-footer"><div className="page-shell"><span>© 2026 Sentinators Gym · Weite SG</span><nav aria-label="Rechtliches"><Link to="/impressum">Impressum</Link><Link to="/datenschutz">Datenschutz</Link>{campaign.metaPixelEnabled && campaign.metaPixelId ? <button className="footer-link-button" type="button" onClick={openCookieSettings}>Cookie-Einstellungen</button> : null}<Link to="/admin">Backoffice</Link></nav></div></footer>
      <div className="mobile-sticky-cta" aria-label="Schnellaktion"><div><span>ab</span><strong>CHF {campaign.singlePriceChf}.–</strong></div><button className="btn btn--primary" type="button" onClick={() => openForm('single')} disabled={inactive}>Platz sichern</button></div>
      <LeadModal open={modal.open} initialOffer={modal.offer} campaign={campaign} onClose={() => setModal((current) => ({ ...current, open: false }))} />
    </>
  );
}

function createFaqs(campaign, dates) {
  return [
    ['Was ist im Preis enthalten?', 'Im Preis enthalten sind 12 Monate Daytime-Training im Sentinators Gym sowie die Membercard.'],
    ['Ist die Membercard inklusive?', 'Ja. Beim Einzelangebot ist eine Membercard inklusive. Beim Besties-Angebot sind zwei persönliche Membercards inklusive.'],
    ['Wann kann ich trainieren?', `Das MAMA TIME Angebot gilt zu den definierten Daytime-Zeiten: ${campaign.daytimeHours || 'Montag bis Freitag, 08:00–16:30 Uhr'}. Die finalen Zeiten werden beim Abschluss bestätigt.`],
    ['Wann beginnt mein Abo?', 'Du sicherst dir das Angebot während der Aktion und vereinbarst deinen Start nach den Schulferien.'],
    ['Gilt das Angebot auch, wenn ich meine Bestie mitbringe?', `Ja. Wenn ihr euch gemeinsam für das Besties-Angebot anmeldet, bezahlt ihr zusammen CHF ${campaign.bestiesPriceChf}.– statt CHF ${campaign.singlePriceChf * 2}.–.`],
    ['Müssen wir gemeinsam trainieren?', 'Nein. Jede Mama erhält ihre eigene Mitgliedschaft und Membercard. Ihr könnt gemeinsam oder unabhängig voneinander trainieren.'],
    ['Kann ich direkt nach der Anmeldung starten oder später?', 'Der geplante Start ist nach den Schulferien. Ein früherer oder späterer Start kann bei der Kontaktaufnahme besprochen werden.'],
    ['Bis wann ist die Aktion gültig?', `Die Aktion ist vom ${dates.startLong} bis und mit ${dates.endLong} gültig. Die Anfrage muss innerhalb dieses Zeitraums eingehen.`]
  ];
}

function formatCampaignDates(campaign) {
  const timezone = campaign.campaignTimezone || 'Europe/Zurich';
  const format = (value, options, fallback) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    return new Intl.DateTimeFormat('de-CH', { timeZone: timezone, ...options }).format(date);
  };
  return {
    startShort: format(campaign.campaignStart, { day: '2-digit', month: '2-digit', year: 'numeric' }, '20.07.2026'),
    endShort: format(campaign.campaignEnd, { day: '2-digit', month: '2-digit', year: 'numeric' }, '20.08.2026'),
    startLong: format(campaign.campaignStart, { day: 'numeric', month: 'long', year: 'numeric' }, '20. Juli 2026'),
    endLong: format(campaign.campaignEnd, { day: 'numeric', month: 'long', year: 'numeric' }, '20. August 2026')
  };
}

function Heading({ children, left = false, dark = false }) { return <div className={`section-heading${left ? ' section-heading--left' : ''}${dark ? ' section-heading--dark' : ''}`}><h2>{children}</h2><div className="heading-ornament"><i /><Icon name="heart" /><i /></div></div>; }
function Benefit({ icon, children }) { return <article className="benefit-card"><Icon name={icon} /><p>{children}</p></article>; }
function Audience({ icon, children }) { return <article><Icon name={icon} /><p>{children}</p></article>; }
function Step({ no, icon, title, children }) { return <li><span className="step-no">{no}</span><span className="step-icon"><Icon name={icon} /></span><div><h3>{title}</h3><p>{children}</p></div></li>; }
function Trust({ icon, title, children }) { return <article><Icon name={icon} /><h3>{title}</h3><p>{children}</p></article>; }
function Community({ icon, children }) { return <div className="community-point"><span className="avatar"><Icon name={icon} /></span><p>{children}</p></div>; }
function Faq({ item, index, open, onToggle }) { const id = `faq-${index}`; return <article className="faq-item"><h3><button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle}>{item[0]}<Icon name={open ? 'close' : 'plus'} /></button></h3><div id={id} className="faq-answer" hidden={!open}>{item[1]}</div></article>; }
