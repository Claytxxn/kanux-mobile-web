-- =====================================================
-- KANUX: Políticas RLS + GRANTs - PARTE 3c
-- chats, chat_members, messages, departments (CRUD) + sequences
-- Execute no Supabase SQL Editor
-- =====================================================

-- 0) Garantir RLS ligado
ALTER TABLE IF EXISTS public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.departments ENABLE ROW LEVEL SECURITY;

-- 1) Funções helpers (caso não existam)
-- Retorna true se o usuário atual (auth.uid) é super admin via user_profiles
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

-- Retorna array de company ids do usuário atual (via company_members)
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

-- 2) Drop policies antigas (se existirem) para evitar conflito
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

-- 3) Policies: departments
CREATE POLICY "departments_select" ON public.departments
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "departments_insert" ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "departments_update" ON public.departments
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()))
  WITH CHECK (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "departments_delete" ON public.departments
  FOR DELETE TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

-- 4) Policies: chats
-- super admin vê tudo; membros veem chats da empresa.
-- chats privados: leitura permitida apenas para super admin ou quem está em chat_members.
CREATE POLICY "chats_select" ON public.chats
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (
      company_id = ANY(public.get_my_company_ids())
      AND (
        is_private = false
        OR EXISTS (
          SELECT 1
          FROM public.chat_members cm
          WHERE cm.chat_id = chats.id
            AND cm.user_profile_id = public.get_my_profile_id()
        )
      )
    )
  );

CREATE POLICY "chats_insert" ON public.chats
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "chats_update" ON public.chats
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()))
  WITH CHECK (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

CREATE POLICY "chats_delete" ON public.chats
  FOR DELETE TO authenticated
  USING (public.is_super_admin() OR company_id = ANY(public.get_my_company_ids()));

-- 5) Policies: chat_members
-- super admin pode gerenciar tudo; admins/gerentes da empresa do chat podem gerenciar membros
CREATE POLICY "chat_members_select" ON public.chat_members
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR user_profile_id = public.get_my_profile_id()
    OR EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = chat_members.chat_id
        AND c.company_id = ANY(public.get_my_company_ids())
    )
  );

CREATE POLICY "chat_members_manage" ON public.chat_members
  FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.chats c
      JOIN public.company_members cm ON cm.company_id = c.company_id
      WHERE c.id = chat_members.chat_id
        AND cm.user_profile_id = public.get_my_profile_id()
        AND cm.role IN ('ADMIN','MANAGER')
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.chats c
      JOIN public.company_members cm ON cm.company_id = c.company_id
      WHERE c.id = chat_members.chat_id
        AND cm.user_profile_id = public.get_my_profile_id()
        AND cm.role IN ('ADMIN','MANAGER')
    )
  );

-- 6) Policies: messages
-- Quem pode ler: super admin ou quem pode ver o chat
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.chats c
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

-- Quem pode inserir: autor deve ser o próprio profile, e precisa ter acesso ao chat
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_profile_id = public.get_my_profile_id()
    AND EXISTS (
      SELECT 1
      FROM public.chats c
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

-- (Opcional) update/delete: somente super admin ou autor
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR user_profile_id = public.get_my_profile_id())
  WITH CHECK (public.is_super_admin() OR user_profile_id = public.get_my_profile_id());

CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE TO authenticated
  USING (public.is_super_admin() OR user_profile_id = public.get_my_profile_id());

-- 7) GRANTs (sem isso, você recebe "permission denied for table ...")
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages TO authenticated;

-- Caso você use sequences (ex.: company_number_seq), liberar também:
-- Ajuste/adicione outras sequences conforme necessário.
GRANT USAGE, SELECT ON SEQUENCE public.company_number_seq TO authenticated;

-- =====================================================
-- FIM DA PARTE 3c
-- =====================================================

