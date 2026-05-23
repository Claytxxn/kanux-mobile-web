-- Adiciona coluna password_hash para autenticação local
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;