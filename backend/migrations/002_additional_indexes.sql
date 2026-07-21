-- MAMA TIME additional indexes
-- Migration: 002_additional_indexes

CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_action ON lead_activities(action);
