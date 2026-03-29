-- =====================================================
-- KANUX: Permissões para Service Role
-- Execute no Supabase SQL Editor
-- =====================================================

-- Garantir que service_role pode usar o schema public
GRANT USAGE ON SCHEMA public TO service_role;

-- Garantir que service_role pode fazer SELECT/INSERT/UPDATE/DELETE em todas as tabelas
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chats TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companies TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.departments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tickets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ticket_comments TO service_role;

-- GRANTs em funções
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_company_ids() TO service_role;

-- GRANTs em sequências
GRANT USAGE, SELECT ON SEQUENCE public.company_number_seq TO service_role;

-- =====================================================
-- Políticas específicas para service_role (bypass RLS)
-- =====================================================

-- Para service_role, permitir tudo (bypass RLS)
-- Nota: O Supabase usa a chave service_role para bypassar RLS automaticamente
-- Mas precisamos garantir que as políticas existam

DROP POLICY IF EXISTS "service_role_chats_insert" ON public.chats;
CREATE POLICY "service_role_chats_insert" ON public.chats
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_chats_select" ON public.chats;
CREATE POLICY "service_role_chats_select" ON public.chats
  FOR SELECT TO service_role
  USING (true);

DROP POLICY IF EXISTS "service_role_messages_insert" ON public.messages;
CREATE POLICY "service_role_messages_insert" ON public.messages
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_messages_select" ON public.messages;
CREATE POLICY "service_role_messages_select" ON public.messages
  FOR SELECT TO service_role
  USING (true);

DROP POLICY IF EXISTS "service_role_companies_insert" ON public.companies;
CREATE POLICY "service_role_companies_insert" ON public.companies
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_companies_select" ON public.companies;
CREATE POLICY "service_role_companies_select" ON public.companies
  FOR SELECT TO service_role
  USING (true);

DROP POLICY IF EXISTS "service_role_company_members_insert" ON public.company_members;
CREATE POLICY "service_role_company_members_insert" ON public.company_members
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_company_members_select" ON public.company_members;
CREATE POLICY "service_role_company_members_select" ON public.company_members
  FOR SELECT TO service_role
  USING (true);

DROP POLICY IF EXISTS "service_role_departments_insert" ON public.departments;
CREATE POLICY "service_role_departments_insert" ON public.departments
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_departments_select" ON public.departments;
CREATE POLICY "service_role_departments_select" ON public.departments
  FOR SELECT TO service_role
  USING (true);

DROP POLICY IF EXISTS "service_role_user_profiles_insert" ON public.user_profiles;
CREATE POLICY "service_role_user_profiles_insert" ON public.user_profiles
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_user_profiles_select" ON public.user_profiles;
CREATE POLICY "service_role_user_profiles_select" ON public.user_profiles
  FOR SELECT TO service_role
  USING (true);

DROP POLICY IF EXISTS "service_role_tickets_insert" ON public.tickets;
CREATE POLICY "service_role_tickets_insert" ON public.tickets
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_tickets_select" ON public.tickets;
CREATE POLICY "service_role_tickets_select" ON public.tickets
  FOR SELECT TO service_role
  USING (true);

-- =====================================================
-- FIM
-- =====================================================
