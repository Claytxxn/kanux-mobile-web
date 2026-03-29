-- =====================================================
-- KANUX: Correção RLS v2 - Resolve recursão infinita e permissão negada
-- Execute no Supabase SQL Editor
-- =====================================================

-- 0) Garantir RLS ligado em todas as tabelas
ALTER TABLE IF EXISTS public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 1) Funções helpers (VERSÃO NÃO-RECURSIVA para evitar loop)
-- Retorna true se o usuário atual é super admin
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

-- Retorna o id do profile do usuário atual
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Retorna array de company ids do usuário atual
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

-- Retorna true se o usuário é admin/manager da empresa
CREATE OR REPLACE FUNCTION public.is_company_admin_or_manager(company_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.company_members cm
    JOIN public.user_profiles up ON up.id = cm.user_profile_id
    WHERE cm.company_id = company_uuid
      AND up.auth_user_id = auth.uid()
      AND cm.role IN ('ADMIN', 'MANAGER')
    LIMIT 1
  );
$$;

-- 2) Drop policies antigas
DROP POLICY IF EXISTS "chats_select" ON public.chats;
DROP POLICY IF EXISTS "chats_insert" ON public.chats;
DROP POLICY IF EXISTS "chats_update" ON public.chats;
DROP POLICY IF EXISTS "chats_delete" ON public.chats;

DROP POLICY IF EXISTS "chat_members_select" ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_insert" ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_delete" ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_manage" ON public.chat_members;

DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;

DROP POLICY IF EXISTS "departments_select" ON public.departments;
DROP POLICY IF EXISTS "departments_insert" ON public.departments;
DROP POLICY IF EXISTS "departments_update" ON public.departments;
DROP POLICY IF EXISTS "departments_delete" ON public.departments;

DROP POLICY IF EXISTS "company_members_select" ON public.company_members;
DROP POLICY IF EXISTS "company_members_insert" ON public.company_members;
DROP POLICY IF EXISTS "company_members_update" ON public.company_members;
DROP POLICY IF EXISTS "company_members_delete" ON public.company_members;

-- 3) Policies: departments
CREATE POLICY "departments_select" ON public.departments
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin() = true
    OR company_id = ANY(public.get_my_company_ids())
  );

CREATE POLICY "departments_insert" ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin() = true
    OR company_id = ANY(public.get_my_company_ids())
  );

CREATE POLICY "departments_update" ON public.departments
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin() = true
    OR company_id = ANY(public.get_my_company_ids())
  )
  WITH CHECK (
    public.is_super_admin() = true
    OR company_id = ANY(public.get_my_company_ids())
  );

CREATE POLICY "departments_delete" ON public.departments
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin() = true
    OR company_id = ANY(public.get_my_company_ids())
  );

-- 4) Policies: chats (VERSÃO SEM RECURSÃO)
CREATE POLICY "chats_select" ON public.chats
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin() = true
    OR (
      company_id = ANY(public.get_my_company_ids())
      AND (
        is_private = false
        OR EXISTS (
          SELECT 1 FROM public.chat_members cm
          WHERE cm.chat_id = chats.id
            AND cm.user_profile_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1)
        )
      )
    )
  );

CREATE POLICY "chats_insert" ON public.chats
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin() = true
    OR company_id = ANY(public.get_my_company_ids())
  );

CREATE POLICY "chats_update" ON public.chats
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin() = true
    OR company_id = ANY(public.get_my_company_ids())
  )
  WITH CHECK (
    public.is_super_admin() = true
    OR company_id = ANY(public.get_my_company_ids())
  );

CREATE POLICY "chats_delete" ON public.chats
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin() = true
    OR company_id = ANY(public.get_my_company_ids())
  );

-- 5) Policies: chat_members
CREATE POLICY "chat_members_select" ON public.chat_members
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin() = true
    OR user_profile_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1)
    OR EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_members.chat_id
        AND c.company_id = ANY(public.get_my_company_ids())
    )
  );

CREATE POLICY "chat_members_insert" ON public.chat_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin() = true
    OR EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_members.chat_id
        AND c.company_id = ANY(public.get_my_company_ids())
    )
  );

CREATE POLICY "chat_members_delete" ON public.chat_members
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin() = true
    OR EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_members.chat_id
        AND c.company_id = ANY(public.get_my_company_ids())
    )
  );

-- 6) Policies: messages
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin() = true
    OR EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id
        AND (
          (c.is_private = false AND c.company_id = ANY(public.get_my_company_ids()))
          OR (c.is_private = true AND EXISTS (
            SELECT 1 FROM public.chat_members cm
            WHERE cm.chat_id = c.id 
              AND cm.user_profile_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1)
          ))
        )
    )
  );

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_profile_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1)
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id
        AND (
          public.is_super_admin() = true
          OR (c.is_private = false AND c.company_id = ANY(public.get_my_company_ids()))
          OR (c.is_private = true AND EXISTS (
            SELECT 1 FROM public.chat_members cm
            WHERE cm.chat_id = c.id 
              AND cm.user_profile_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1)
          ))
        )
    )
  );

CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin() = true
    OR user_profile_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    public.is_super_admin() = true
    OR user_profile_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin() = true
    OR user_profile_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1)
  );

-- 7) Policies: company_members (PERMITE REMOVER MEMBROS)
CREATE POLICY "company_members_select" ON public.company_members
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin() = true
    OR user_profile_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1)
    OR company_id = ANY(public.get_my_company_ids())
  );

CREATE POLICY "company_members_insert" ON public.company_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin() = true
    OR public.is_company_admin_or_manager(company_id) = true
  );

CREATE POLICY "company_members_update" ON public.company_members
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin() = true
    OR public.is_company_admin_or_manager(company_id) = true
  )
  WITH CHECK (
    public.is_super_admin() = true
    OR public.is_company_admin_or_manager(company_id) = true
  );

CREATE POLICY "company_members_delete" ON public.company_members
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin() = true
    OR public.is_company_admin_or_manager(company_id) = true
  );

-- 8) GRANTs (sem isso, "permission denied")
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_profiles TO authenticated;

-- =====================================================
-- FIM
-- =====================================================

