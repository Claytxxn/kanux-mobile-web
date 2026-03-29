-- =====================================================
-- KANUX: Correção Completa de Permissões
-- Execute no Supabase SQL Editor
-- =====================================================

-- 1) Garantir permissões no esquema public
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

-- 2) Habilitar RLS em todas as tabelas principais
ALTER TABLE IF EXISTS public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- 3) Funções auxiliares
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT up.is_super_admin FROM public.user_profiles up WHERE up.auth_user_id = auth.uid() LIMIT 1),
    false
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
  SELECT ARRAY(
    SELECT cm.company_id
    FROM public.company_members cm
    WHERE cm.user_profile_id = public.get_my_profile_id()
  );
$$;

-- 4) Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "chats_select" ON public.chats;
DROP POLICY IF EXISTS "chats_insert" ON public.chats;
DROP POLICY IF EXISTS "chats_update" ON public.chats;
DROP POLICY IF EXISTS "chats_delete" ON public.chats;

DROP POLICY IF EXISTS "chat_members_select" ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_insert" ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_delete" ON public.chat_members;

DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;

DROP POLICY IF EXISTS "companies_select" ON public.companies;
DROP POLICY IF EXISTS "companies_insert" ON public.companies;
DROP POLICY IF EXISTS "companies_update" ON public.companies;
DROP POLICY IF EXISTS "companies_delete" ON public.companies;

DROP POLICY IF EXISTS "company_members_select" ON public.company_members;
DROP POLICY IF EXISTS "company_members_insert" ON public.company_members;
DROP POLICY IF EXISTS "company_members_update" ON public.company_members;
DROP POLICY IF EXISTS "company_members_delete" ON public.company_members;

DROP POLICY IF EXISTS "departments_select" ON public.departments;
DROP POLICY IF EXISTS "departments_insert" ON public.departments;
DROP POLICY IF EXISTS "departments_update" ON public.departments;
DROP POLICY IF EXISTS "departments_delete" ON public.departments;

DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON public.user_profiles;

DROP POLICY IF EXISTS "tickets_select" ON public.tickets;
DROP POLICY IF EXISTS "tickets_insert" ON public.tickets;
DROP POLICY IF EXISTS "tickets_update" ON public.tickets;
DROP POLICY IF EXISTS "tickets_delete" ON public.tickets;

-- 5) Políticas para companies
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR id = ANY(public.get_my_company_ids()));

CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR id = ANY(public.get_my_company_ids()));

CREATE POLICY "companies_delete" ON public.companies
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- 6) Políticas para company_members
CREATE POLICY "company_members_select" ON public.company_members
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "company_members_insert" ON public.company_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "company_members_update" ON public.company_members
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "company_members_delete" ON public.company_members
  FOR DELETE TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

-- 7) Políticas para departments
CREATE POLICY "departments_select" ON public.departments
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "departments_insert" ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "departments_update" ON public.departments
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "departments_delete" ON public.departments
  FOR DELETE TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

-- 8) Políticas para chats
CREATE POLICY "chats_select" ON public.chats
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (
      company_id = ANY(public.get_my_company_ids())
      AND (
        is_private = false
        OR EXISTS (
          SELECT 1 FROM public.chat_members cm
          WHERE cm.chat_id = chats.id AND cm.user_profile_id = public.get_my_profile_id()
        )
      )
    )
  );

CREATE POLICY "chats_insert" ON public.chats
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "chats_update" ON public.chats
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "chats_delete" ON public.chats
  FOR DELETE TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

-- 9) Políticas para chat_members
CREATE POLICY "chat_members_select" ON public.chat_members
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR user_profile_id = public.get_my_profile_id()
    OR EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_members.chat_id AND c.company_id = ANY(public.get_my_company_ids())
    )
  );

CREATE POLICY "chat_members_insert" ON public.chat_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_members.chat_id AND c.company_id = ANY(public.get_my_company_ids())
    )
  );

CREATE POLICY "chat_members_delete" ON public.chat_members
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_members.chat_id AND c.company_id = ANY(public.get_my_company_ids())
    )
  );

-- 10) Políticas para messages
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id
      AND (
        (c.is_private = false AND c.company_id = ANY(public.get_my_company_ids()))
        OR (c.is_private = true AND EXISTS (
          SELECT 1 FROM public.chat_members cm
          WHERE cm.chat_id = c.id AND cm.user_profile_id = public.get_my_profile_id()
        ))
      )
    )
  );

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_profile_id = public.get_my_profile_id()
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id
      AND (
        public.is_super_admin()
        OR (c.is_private = false AND c.company_id = ANY(public.get_my_company_ids()))
        OR (c.is_private = true AND EXISTS (
          SELECT 1 FROM public.chat_members cm
          WHERE cm.chat_id = c.id AND cm.user_profile_id = public.get_my_profile_id()
        ))
      )
    )
  );

CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR user_profile_id = public.get_my_profile_id());

CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE TO authenticated
  USING (public.is_super_admin() OR user_profile_id = public.get_my_profile_id());

-- 11) Políticas para user_profiles
CREATE POLICY "user_profiles_select" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "user_profiles_insert" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "user_profiles_update" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid() OR public.is_super_admin());

-- 12) Políticas para tickets
CREATE POLICY "tickets_select" ON public.tickets
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "tickets_insert" ON public.tickets
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "tickets_update" ON public.tickets
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "tickets_delete" ON public.tickets
  FOR DELETE TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

-- 13) GRANTs em todas as tabelas
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ticket_comments TO authenticated;

-- 14) GRANTs em sequências
GRANT USAGE, SELECT ON SEQUENCE public.company_number_seq TO authenticated;

-- 15) GRANTs em funções
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_company_ids() TO authenticated;

-- 16) Permissões padrão para futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;

-- =====================================================
-- FIM
-- =====================================================
