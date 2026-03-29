-- =====================================================
-- KANUX: Correção RLS para Service Role
-- Resolve erro de permissão ao criar chat via API
-- Execute no Supabase SQL Editor
-- =====================================================

-- 0) Garantir RLS ligado nas tabelas principais
ALTER TABLE IF EXISTS public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;

-- 1) Remover políticas antigas de service_role (se existirem)
DROP POLICY IF EXISTS "service_role_chats_all" ON public.chats;
DROP POLICY IF EXISTS "service_role_chats_select" ON public.chats;
DROP POLICY IF EXISTS "service_role_chats_insert" ON public.chats;
DROP POLICY IF EXISTS "service_role_chats_update" ON public.chats;
DROP POLICY IF EXISTS "service_role_chats_delete" ON public.chats;

DROP POLICY IF EXISTS "service_role_chat_members_all" ON public.chat_members;
DROP POLICY IF EXISTS "service_role_chat_members_select" ON public.chat_members;
DROP POLICY IF EXISTS "service_role_chat_members_insert" ON public.chat_members;
DROP POLICY IF EXISTS "service_role_chat_members_update" ON public.chat_members;
DROP POLICY IF EXISTS "service_role_chat_members_delete" ON public.chat_members;

DROP POLICY IF EXISTS "service_role_messages_all" ON public.messages;
DROP POLICY IF EXISTS "service_role_messages_select" ON public.messages;
DROP POLICY IF EXISTS "service_role_messages_insert" ON public.messages;
DROP POLICY IF EXISTS "service_role_messages_update" ON public.messages;
DROP POLICY IF EXISTS "service_role_messages_delete" ON public.messages;

-- 2) Criar políticas para service_role (bypass completo do RLS)
-- Estas políticas permitem que a API use service_role key sem restrições

-- Política ALL para chats (cobre SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "service_role_chats_all" ON public.chats
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Política ALL para chat_members
CREATE POLICY "service_role_chat_members_all" ON public.chat_members
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Política ALL para messages
CREATE POLICY "service_role_messages_all" ON public.messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 3) Garantir GRANTs para service_role
GRANT ALL ON TABLE public.chats TO service_role;
GRANT ALL ON TABLE public.chat_members TO service_role;
GRANT ALL ON TABLE public.messages TO service_role;

-- 4) Garantir acesso às sequences (para inserts com auto-increment)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =====================================================
-- FIM - Execute este script no SQL Editor do Supabase
-- =====================================================
