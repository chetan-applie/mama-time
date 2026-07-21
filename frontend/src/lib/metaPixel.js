const CONSENT_STORAGE_KEY = 'mama_time_marketing_consent_v1';
const CONSENT_CHANGED_EVENT = 'mama-time-marketing-consent-changed';
export const OPEN_COOKIE_SETTINGS_EVENT = 'mama-time-open-cookie-settings';

let pixelConfig = { enabled: false, pixelId: '' };
let initializedPixelId = '';
let pageViewTracked = false;
let queuedViewContent = null;
let viewContentTracked = false;

function validPixelId(value) {
  return /^\d{5,30}$/.test(String(value || '').trim());
}

export function getMarketingConsent() {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (value === 'granted') return true;
    if (value === 'denied') return false;
  } catch {
    // Consent remains undecided when local storage is unavailable.
  }
  return null;
}

function writeConsent(granted) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, granted ? 'granted' : 'denied');
  } catch {
    // The application still works when storage is blocked.
  }
}

function dispatchConsentChanged(granted) {
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: { granted } }));
}

function createFbqStub() {
  if (typeof window.fbq === 'function') return;
  const fbq = function (...args) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  };
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
}

function insertPixelScript() {
  if (document.querySelector('script[data-mama-time-meta-pixel]')) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  script.dataset.mamaTimeMetaPixel = 'true';
  document.head.appendChild(script);
}

function safeMetaParameters(parameters = {}) {
  const allowed = [
    'content_name', 'content_category', 'content_type', 'offer_type',
    'contact_method', 'value', 'currency'
  ];
  return Object.fromEntries(
    allowed
      .filter((key) => parameters[key] !== undefined && parameters[key] !== null && parameters[key] !== '')
      .map((key) => [key, parameters[key]])
  );
}

function clearFirstPartyMetaCookies() {
  const hostname = window.location.hostname;
  const labels = hostname.split('.').filter(Boolean);
  const rootDomain = labels.length >= 2 ? labels.slice(-2).join('.') : hostname;
  const domains = new Set(['', hostname, rootDomain]);
  for (const name of ['_fbp', '_fbc']) {
    for (const domain of domains) {
      const domainPart = domain ? `; domain=.${domain}` : '';
      document.cookie = `${name}=; Max-Age=0; path=/${domainPart}; SameSite=Lax`;
    }
  }
}

function initializePixel() {
  const { enabled, pixelId } = pixelConfig;
  if (!enabled || !validPixelId(pixelId) || getMarketingConsent() !== true) return false;

  createFbqStub();
  insertPixelScript();

  if (initializedPixelId !== pixelId) {
    window.fbq('consent', 'grant');
    window.fbq('init', pixelId);
    initializedPixelId = pixelId;
    pageViewTracked = false;
    viewContentTracked = false;
  } else {
    window.fbq('consent', 'grant');
  }

  if (!pageViewTracked) {
    window.fbq('track', 'PageView');
    pageViewTracked = true;
  }

  if (!queuedViewContent && window.location.pathname === '/' && !viewContentTracked) {
    queuedViewContent = { content_name: 'MAMA TIME 2026', content_category: 'Daytime Training' };
  }
  if (queuedViewContent && !viewContentTracked) {
    window.fbq('track', 'ViewContent', safeMetaParameters(queuedViewContent));
    viewContentTracked = true;
    queuedViewContent = null;
  }
  return true;
}

export function configureMetaPixel({ enabled = false, pixelId = '' } = {}) {
  pixelConfig = {
    enabled: Boolean(enabled) && validPixelId(pixelId),
    pixelId: String(pixelId || '').trim()
  };
  if (pixelConfig.enabled && getMarketingConsent() === true) initializePixel();
}

export function setMarketingConsent(granted) {
  const allowed = Boolean(granted);
  writeConsent(allowed);
  if (allowed) {
    initializePixel();
  } else {
    queuedViewContent = null;
    if (typeof window.fbq === 'function') window.fbq('consent', 'revoke');
    clearFirstPartyMetaCookies();
  }
  dispatchConsentChanged(allowed);
}

export function trackMetaEvent(eventName, parameters = {}, options = {}) {
  if (!pixelConfig.enabled || !validPixelId(pixelConfig.pixelId)) return;

  const consent = getMarketingConsent();
  if (eventName === 'ViewContent' && options.deferUntilConsent && !viewContentTracked) {
    queuedViewContent = safeMetaParameters(parameters);
  }
  if (consent !== true) return;
  if (!initializePixel()) return;

  if (eventName === 'ViewContent') {
    if (viewContentTracked) return;
    window.fbq('track', 'ViewContent', safeMetaParameters(parameters));
    viewContentTracked = true;
    queuedViewContent = null;
    return;
  }

  window.fbq('track', eventName, safeMetaParameters(parameters));
}

export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
}

export function onMarketingConsentChanged(listener) {
  const handler = (event) => listener(Boolean(event.detail?.granted));
  window.addEventListener(CONSENT_CHANGED_EVENT, handler);
  return () => window.removeEventListener(CONSENT_CHANGED_EVENT, handler);
}
