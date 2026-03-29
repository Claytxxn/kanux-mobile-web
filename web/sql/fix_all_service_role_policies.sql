-- =====================================================
-- KANUX: Política completa de Service Role para todas as tabelas
-- Execute no Supabase SQL Editor
-- =====================================================

-- 0) Primeiro, garantir permissões básicas no schema
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- 1) Tabela: chats
ALTER TABLE IF EXISTS public.chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_chats" ON public.chats;
CREATE POLICY "service_role_all_chats" ON public.chats
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
GRANT ALL ON TABLE public.chats TO service_role;

-- 2) Tabela: chat_members
ALTER TABLE IF EXISTS public.chat_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_chat_members" ON public.chat_members;
CREATE POLICY "service_role_all_chat_members" ON public.chat_members
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
GRANT ALL ON TABLE public.chat_members TO service_role;

-- 3) Tabela: messages
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_messages" ON public.messages;
CREATE POLICY "service_role_all_messages" ON public.messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
GRANT ALL ON TABLE public.messages TO service_role;

-- 4) Tabela: companies
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_companies" ON public.companies;
CREATE POLICY "service_role_all_companies" ON public.companies
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
GRANT ALL ON TABLE public.companies TO service_role;

-- 5) Tabela: company_members
ALTER TABLE IF EXISTS public.company_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_company_members" ON public.company_members;
CREATE POLICY "service_role_all_company_members" ON public.company_members
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
GRANT ALL ON TABLE public.company_members TO service_role;

-- 6) Tabela: departments
ALTER TABLE IF EXISTS public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_departments" ON public.departments;
CREATE POLICY "service_role_all_departments" ON public.departments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
GRANT ALL ON TABLE public.departments TO service_role;

-- 7) Tabela: user_profiles
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_user_profiles" ON public.user_profiles;
CREATE POLICY "service_role_all_user_profiles" ON public.user_profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
GRANT ALL ON TABLE public.user_profiles TO service_role;

-- 8) Tabela: tickets
ALTER TABLE IF EXISTS public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_tickets" ON public.tickets;
CREATE POLICY "service_role_all_tickets" ON public.tickets
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
GRANT ALL ON TABLE public.tickets TO service_role;

-- 9) Tabela: ticket_comments
ALTER TABLE IF EXISTS public.ticket_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_ticket_comments" ON public.ticket_comments;
CREATE POLICY "service_role_all_ticket_comments" ON public.ticket_comments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
GRANT ALL ON TABLE public.ticket_comments TO service_role;

-- 10) Tabela: attachments
ALTER TABLE IF EXISTS public.attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_attachments" ON public.attachments;
CREATE POLICY "service_role_all_attachments" ON public.attachments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
GRANT ALL ON TABLE public.attachments TO service_role;

-- 11) Tabela: audit_logs
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_audit_logs" ON public.audit_logs;
CREATE POLICY "service_role_all_audit_logs" ON public.audit_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
GRANT ALL ON TABLE public.audit_logs TO service_role;

-- 12) Permissões em sequências
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 13) Verificar se todas as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles
FROM pg_policies 
WHERE policyname LIKE 'service_role_%'
ORDER BY tablename;

-- 14) Teste simples de inserção
-- Execute este teste manualmente no SQL Editor do Supabase:
-- INSERT INTO public.chats (name, company_id, is_private) VALUES ('teste', '00000000-0000-0000-0000-000000000001', false);

-- =====================================================
-- FIM - Execute este script no SQL Editor do Supabase
-- =====================================================
