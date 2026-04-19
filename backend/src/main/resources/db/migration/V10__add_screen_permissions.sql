-- V10: Add screen_permissions JSONB column to company_members
ALTER TABLE company_members
  ADD COLUMN IF NOT EXISTS screen_permissions JSONB DEFAULT '{}'::jsonb;
