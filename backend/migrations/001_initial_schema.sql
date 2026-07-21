-- MAMA TIME PostgreSQL schema
-- Migration: 001_initial_schema

CREATE TABLE IF NOT EXISTS admins (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(160) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  auth_version INTEGER NOT NULL DEFAULT 1 CHECK (auth_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(active);

CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  reference VARCHAR(40) NOT NULL UNIQUE,
  offer_type VARCHAR(20) NOT NULL CHECK (offer_type IN ('single', 'besties')),
  offer_label VARCHAR(80) NOT NULL,
  amount_chf INTEGER NOT NULL CHECK (amount_chf > 0),

  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(180) NOT NULL,
  normalized_email VARCHAR(180) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  normalized_phone VARCHAR(50) NOT NULL,
  preferred_contact VARCHAR(50) NOT NULL,
  start_preference VARCHAR(120) NOT NULL,

  bestie_first_name VARCHAR(80) NOT NULL DEFAULT '',
  bestie_last_name VARCHAR(80) NOT NULL DEFAULT '',
  bestie_email VARCHAR(180) NOT NULL DEFAULT '',
  bestie_phone VARCHAR(50) NOT NULL DEFAULT '',

  message TEXT NOT NULL DEFAULT '',
  privacy_consent BOOLEAN NOT NULL DEFAULT TRUE,
  privacy_consent_at TIMESTAMPTZ NOT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'callback', 'won', 'lost', 'duplicate', 'archived')),
  assigned_to VARCHAR(120) NOT NULL DEFAULT '',
  callback_at VARCHAR(80) NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  lost_reason VARCHAR(500) NOT NULL DEFAULT '',

  duplicate_of BIGINT NULL REFERENCES leads(id) ON DELETE SET NULL,
  is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT leads_duplicate_consistency CHECK (
    (is_duplicate = FALSE AND duplicate_of IS NULL)
    OR
    (is_duplicate = TRUE AND duplicate_of IS NOT NULL)
  ),

  utm_source VARCHAR(255) NOT NULL DEFAULT '',
  utm_medium VARCHAR(255) NOT NULL DEFAULT '',
  utm_campaign VARCHAR(255) NOT NULL DEFAULT '',
  utm_content VARCHAR(255) NOT NULL DEFAULT '',
  utm_term VARCHAR(255) NOT NULL DEFAULT '',
  fbclid VARCHAR(500) NOT NULL DEFAULT '',
  gclid VARCHAR(500) NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  landing_url TEXT NOT NULL DEFAULT '',
  page_variant VARCHAR(100) NOT NULL DEFAULT '',
  screen VARCHAR(100) NOT NULL DEFAULT '',

  ip_hash VARCHAR(128) NOT NULL DEFAULT '',
  user_agent VARCHAR(600) NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status_created_at ON leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_offer_created_at ON leads(offer_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads(utm_source);
CREATE INDEX IF NOT EXISTS idx_leads_normalized_email_created ON leads(normalized_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_normalized_phone_created ON leads(normalized_phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_duplicate_of ON leads(duplicate_of);
CREATE INDEX IF NOT EXISTS idx_leads_callback_at ON leads(callback_at);

CREATE TABLE IF NOT EXISTS lead_activities (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('system', 'admin')),
  actor_id BIGINT NULL REFERENCES admins(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_created ON lead_activities(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_actor ON lead_activities(actor_id);
