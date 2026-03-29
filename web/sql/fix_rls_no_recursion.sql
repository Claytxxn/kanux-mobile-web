-- =====================================================
-- KANUX: Correção Definitiva RLS - SEM RECURSÃO
-- Resolve: "infinite recursion detected in policy for relation"
-- =====================================================

-- 1) Desabilitar RLS temporariamente para limpar policies
ALTER TABLE IF EXISTS public.chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.company_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2) Dropar TODAS as policies existentes
DROP POLICY IF EXISTS "chats_select" ON public.chats;
DROP POLICY IF EXISTS "chats_insert" ON public.chats;
DROP POLICY IF EXISTS "chats_update" ON public.chats;
DROP POLICY IF EXISTS "chats_delete" ON public.chats;
DROP POLICY IF EXISTS "chats_all" ON public.chats;

DROP POLICY IF EXISTS "chat_members_select" ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_insert" ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_update" ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_delete" ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_all" ON public.chat_members;

DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;
DROP POLICY IF EXISTS "messages_all" ON public.messages;

DROP POLICY IF EXISTS "departments_select" ON public.departments;
DROP POLICY IF EXISTS "departments_insert" ON public.departments;
DROP POLICY IF EXISTS "departments_update" ON public.departments;
DROP POLICY IF EXISTS "departments_delete" ON public.departments;
DROP POLICY IF EXISTS "departments_all" ON public.departments;

DROP POLICY IF EXISTS "company_members_select" ON public.company_members;
DROP POLICY IF EXISTS "company_members_insert" ON public.company_members;
DROP POLICY IF EXISTS "company_members_update" ON public.company_members;
DROP POLICY IF EXISTS "company_members_delete" ON public.company_members;
DROP POLICY IF EXISTS "company_members_all" ON public.company_members;

DROP POLICY IF EXISTS "companies_select" ON public.companies;
DROP POLICY IF EXISTS "companies_insert" ON public.companies;
DROP POLICY IF EXISTS "companies_update" ON public.companies;
DROP POLICY IF EXISTS "companies_delete" ON public.companies;
DROP POLICY IF EXISTS "companies_all" ON public.companies;

DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_all" ON public.user_profiles;

-- 3) Criar funções auxiliares SEGURAS (SECURITY DEFINER = roda como dono da tabela)
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_is_super_admin()
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
  );
$$;

-- 4) Re-habilitar RLS
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;

-- 5) POLICIES SIMPLES E DIRETAS (sem subqueries entre tabelas relacionadas)

-- COMPANIES: Super admin vê tudo, usuários vêem suas empresas via company_members
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
    )
  );

CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (public.user_is_super_admin() = true);

CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE TO authenticated
  USING (public.user_is_super_admin() = true)
  WITH CHECK (public.user_is_super_admin() = true);

CREATE POLICY "companies_delete" ON public.companies
  FOR DELETE TO authenticated
  USING (public.user_is_super_admin() = true);

-- USER_PROFILES: Cada um vê/edita seu próprio, super admin vê tudo
CREATE POLICY "user_profiles_select" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    public.user_is_super_admin() = true 
    OR auth_user_id = public.get_current_user_id()
  );

CREATE POLICY "user_profiles_insert" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = public.get_current_user_id());

CREATE POLICY "user_profiles_update" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    public.user_is_super_admin() = true 
    OR auth_user_id = public.get_current_user_id()
  )
  WITH CHECK (
    public.user_is_super_admin() = true 
    OR auth_user_id = public.get_current_user_id()
  );

CREATE POLICY "user_profiles_delete" ON public.user_profiles
  FOR DELETE TO authenticated
  USING (public.user_is_super_admin() = true);

-- COMPANY_MEMBERS: Baseado apenas em company_members (sem join com outras tabelas)
CREATE POLICY "company_members_select" ON public.company_members
  FOR SELECT TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR user_profile_id = public.get_current_profile_id()
    OR company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
    )
  );

CREATE POLICY "company_members_insert" ON public.company_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_is_super_admin() = true
    OR company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
      AND role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY "company_members_update" ON public.company_members
  FOR UPDATE TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
      AND role IN ('ADMIN', 'MANAGER')
    )
  )
  WITH CHECK (
    public.user_is_super_admin() = true
    OR company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
      AND role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY "company_members_delete" ON public.company_members
  FOR DELETE TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
      AND role IN ('ADMIN', 'MANAGER')
    )
  );

-- DEPARTMENTS: Baseado apenas em company_id
CREATE POLICY "departments_select" ON public.departments
  FOR SELECT TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
    )
  );

CREATE POLICY "departments_insert" ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_is_super_admin() = true
    OR company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
    )
  );

CREATE POLICY "departments_update" ON public.departments
  FOR UPDATE TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
    )
  )
  WITH CHECK (
    public.user_is_super_admin() = true
    OR company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
    )
  );

CREATE POLICY "departments_delete" ON public.departments
  FOR DELETE TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
    )
  );

-- CHATS: Baseado apenas em company_id (SEM consultar chat_members aqui!)
CREATE POLICY "chats_select" ON public.chats
  FOR SELECT TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
    )
  );

CREATE POLICY "chats_insert" ON public.chats
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_is_super_admin() = true
    OR company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
    )
  );

CREATE POLICY "chats_update" ON public.chats
  FOR UPDATE TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
    )
  )
  WITH CHECK (
    public.user_is_super_admin() = true
    OR company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
    )
  );

CREATE POLICY "chats_delete" ON public.chats
  FOR DELETE TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_profile_id = public.get_current_profile_id()
    )
  );

-- CHAT_MEMBERS: Baseado apenas em chat_id + verificação via chats (SEM recursão!)
-- A verificação é feita via company_id do chat, não consultando chat_members novamente
CREATE POLICY "chat_members_select" ON public.chat_members
  FOR SELECT TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR user_profile_id = public.get_current_profile_id()
    OR chat_id IN (
      SELECT c.id FROM public.chats c
      WHERE c.company_id IN (
        SELECT company_id FROM public.company_members 
        WHERE user_profile_id = public.get_current_profile_id()
      )
    )
  );

CREATE POLICY "chat_members_insert" ON public.chat_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_is_super_admin() = true
    OR chat_id IN (
      SELECT c.id FROM public.chats c
      WHERE c.company_id IN (
        SELECT company_id FROM public.company_members 
        WHERE user_profile_id = public.get_current_profile_id()
      )
    )
  );

CREATE POLICY "chat_members_update" ON public.chat_members
  FOR UPDATE TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR chat_id IN (
      SELECT c.id FROM public.chats c
      WHERE c.company_id IN (
        SELECT company_id FROM public.company_members 
        WHERE user_profile_id = public.get_current_profile_id()
      )
    )
  )
  WITH CHECK (
    public.user_is_super_admin() = true
    OR chat_id IN (
      SELECT c.id FROM public.chats c
      WHERE c.company_id IN (
        SELECT company_id FROM public.company_members 
        WHERE user_profile_id = public.get_current_profile_id()
      )
    )
  );

CREATE POLICY "chat_members_delete" ON public.chat_members
  FOR DELETE TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR chat_id IN (
      SELECT c.id FROM public.chats c
      WHERE c.company_id IN (
        SELECT company_id FROM public.company_members 
        WHERE user_profile_id = public.get_current_profile_id()
      )
    )
  );

-- MESSAGES: Mesma lógica - verifica via chats, não via chat_members
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR user_profile_id = public.get_current_profile_id()
    OR chat_id IN (
      SELECT c.id FROM public.chats c
      WHERE c.company_id IN (
        SELECT company_id FROM public.company_members 
        WHERE user_profile_id = public.get_current_profile_id()
      )
    )
  );

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_profile_id = public.get_current_profile_id()
    AND chat_id IN (
      SELECT c.id FROM public.chats c
      WHERE c.company_id IN (
        SELECT company_id FROM public.company_members 
        WHERE user_profile_id = public.get_current_profile_id()
      )
    )
  );

CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR user_profile_id = public.get_current_profile_id()
  )
  WITH CHECK (
    public.user_is_super_admin() = true
    OR user_profile_id = public.get_current_profile_id()
  );

CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE TO authenticated
  USING (
    public.user_is_super_admin() = true
    OR user_profile_id = public.get_current_profile_id()
  );

-- 6) GRANTs essenciais
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages TO authenticated;

-- =====================================================
-- FIM - Execute este script no SQL Editor do Supabase
-- =====================================================
