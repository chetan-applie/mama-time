import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api.js';
import { configureMetaPixel, trackMetaEvent } from './metaPixel.js';

export const DEFAULT_CAMPAIGN = {
  campaignName: 'MAMA TIME',
  campaignEnforce: false,
  campaignStart: '2026-07-20T00:00:00+02:00',
  campaignEnd: '2026-08-20T23:59:59+02:00',
  campaignStatus: 'active',
  formEnabled: true,
  singlePriceChf: 550,
  bestiesPriceChf: 990,
  savingsChf: 110,
  savingsPercent: 10,
  bestiesPerPersonChf: 495,
  daytimeHours: 'Montag bis Freitag, 08:00–16:30 Uhr',
  whatsappNumber: '',
  whatsappMessage: 'Hallo Sentinators Gym, ich interessiere mich für die MAMA TIME Aktion.',
  companyName: 'Sentinators Gym',
  companyLocation: 'Weite SG',
  metaPixelEnabled: false,
  metaPixelId: ''
};

export function useCampaign({ trackingAllowed = true } = {}) {
  const [campaign, setCampaign] = useState(DEFAULT_CAMPAIGN);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    apiFetch('/api/public/config')
      .then((result) => {
        const next = { ...DEFAULT_CAMPAIGN, ...result };
        if (active) setCampaign(next);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    configureMetaPixel({
      enabled: trackingAllowed && campaign.metaPixelEnabled,
      pixelId: campaign.metaPixelId
    });
  }, [campaign.metaPixelEnabled, campaign.metaPixelId, trackingAllowed]);

  return { campaign, loading };
}

export function useWhatsappUrl(campaign) {
  return useMemo(() => {
    const number = String(campaign.whatsappNumber || '').replace(/\D/g, '');
    if (number.length < 10) return '';
    return `https://wa.me/${number}?text=${encodeURIComponent(campaign.whatsappMessage || '')}`;
  }, [campaign.whatsappNumber, campaign.whatsappMessage]);
}

export function persistAttribution() {
  const params = new URLSearchParams(window.location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
  const data = {};
  for (const key of keys) {
    const fromUrl = params.get(key);
    try {
      if (fromUrl) sessionStorage.setItem(`mama_time_${key}`, fromUrl);
      data[key] = fromUrl || sessionStorage.getItem(`mama_time_${key}`) || '';
    } catch {
      data[key] = fromUrl || '';
    }
  }
  return data;
}

export function trackEvent(eventName, detail = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...detail });
    const mapping = {
      mama_time_landing_view: { name: 'ViewContent', deferUntilConsent: true },
      mama_time_form_submit: { name: 'Lead' },
      mama_time_whatsapp_click: { name: 'Contact' }
    };
    const metaEvent = mapping[eventName];
    if (metaEvent) trackMetaEvent(metaEvent.name, detail, { deferUntilConsent: Boolean(metaEvent.deferUntilConsent) });
  } catch {
    // Tracking must never break the application.
  }
}
