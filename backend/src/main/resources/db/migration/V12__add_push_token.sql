-- V12: Adiciona coluna push_token para notificações push (Expo)
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Índice para lookup rápido por push_token
CREATE INDEX IF NOT EXISTS idx_user_profiles_push_token
    ON user_profiles (push_token)
    WHERE push_token IS NOT NULL;
