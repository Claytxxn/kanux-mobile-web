-- Adicionar campo only_admins_send na tabela chats
-- Controla se apenas admins/managers podem enviar mensagens no chat
ALTER TABLE chats ADD COLUMN IF NOT EXISTS only_admins_send BOOLEAN NOT NULL DEFAULT false;
