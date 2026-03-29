-- =====================================================
-- KANUX: Script Completo de Permissões e RLS
-- Execute no Supabase SQL Editor
-- =====================================================

-- 1) Garantir que todas as tabelas têm RLS habilitado
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- 2) Criar funções helpers
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles 
    WHERE auth_user_id = auth.uid() 
    AND is_super_admin = true
    LIMIT 1
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_company_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT cm.company_id
      FROM public.company_members cm
      WHERE cm.user_profile_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1)
    ),
    ARRAY[]::uuid[]
  );
$$;

-- 3) GRANTs para autenticados
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4) GRANTs para service_role (para server-side API)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 5) GRANTs para anon
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- 6) Policies para Companies
DROP POLICY IF EXISTS "companies_select" ON public.companies;
DROP POLICY IF EXISTS "companies_insert" ON public.companies;

CREATE POLICY "companies_select" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "companies_insert" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);

-- 7) Policies para Departments
DROP POLICY IF EXISTS "departments_all" ON public.departments;
CREATE POLICY "departments_all" ON public.departments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8) Policies para User Profiles
DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON public.user_profiles;

CREATE POLICY "user_profiles_select" ON public.user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_profiles_insert" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "user_profiles_update" ON public.user_profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 9) Policies para Company Members
DROP POLICY IF EXISTS "company_members_all" ON public.company_members;
CREATE POLICY "company_members_all" ON public.company_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10) Policies para Chats
DROP POLICY IF EXISTS "chats_all" ON public.chats;
CREATE POLICY "chats_all" ON public.chats FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 11) Policies para Chat Members
DROP POLICY IF EXISTS "chat_members_all" ON public.chat_members;
CREATE POLICY "chat_members_all" ON public.chat_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 12) Policies para Messages
DROP POLICY IF EXISTS "messages_all" ON public.messages;
CREATE POLICY "messages_all" ON public.messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 13) Policies para Tickets
DROP POLICY IF EXISTS "tickets_all" ON public.tickets;
CREATE POLICY "tickets_all" ON public.tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 14) Policies para Ticket Comments
DROP POLICY IF EXISTS "ticket_comments_all" ON public.ticket_comments;
CREATE POLICY "ticket_comments_all" ON public.ticket_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 15) Policies específicas para service_role (bypass total)
DROP POLICY IF EXISTS "service_role_bypass" ON public.chats;
CREATE POLICY "service_role_bypass" ON public.chats FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_messages" ON public.messages;
CREATE POLICY "service_role_bypass_messages" ON public.messages FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_companies" ON public.companies;
CREATE POLICY "service_role_bypass_companies" ON public.companies FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_departments" ON public.departments;
CREATE POLICY "service_role_bypass_departments" ON public.departments FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_company_members" ON public.company_members;
CREATE POLICY "service_role_bypass_company_members" ON public.company_members FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_user_profiles" ON public.user_profiles;
CREATE POLICY "service_role_bypass_user_profiles" ON public.user_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_tickets" ON public.tickets;
CREATE POLICY "service_role_bypass_tickets" ON public.tickets FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Verificar se funcionou
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- FIM
-- =====================================================
