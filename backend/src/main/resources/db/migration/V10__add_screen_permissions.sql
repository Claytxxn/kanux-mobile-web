-- V10: Adiciona coluna screen_permissions (JSONB) na tabela company_members
ALTER TABLE company_members
  ADD COLUMN IF NOT EXISTS screen_permissions JSONB DEFAULT '{}'::jsonb;
