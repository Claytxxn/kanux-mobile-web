-- ============================================================
-- KANUX: Fix Definitivo RLS v3
-- Resolve: infinite recursion, políticas duplicadas/conflitantes,
--          FK duplicado, políticas ausentes em tickets/ticket_comments
-- Execute no Supabase SQL Editor (Dashboard > SQL Editor)
-- Data: 2026-04-19
-- ============================================================

-- ============================================================
-- PARTE 1: FUNÇÕES AUXILIARES (sem recursão RLS)
-- ============================================================

-- get_my_profile_id() — retorna o id do user_profiles do usuário logado
-- SECURITY DEFINER + row_security=off para bypassar RLS
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT id
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- get_my_company_ids() — retorna array de company_id do usuário logado
-- SECURITY DEFINER + row_security=off para bypassar RLS e evitar recursão
CREATE OR REPLACE FUNCTION public.get_my_company_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT cm.company_id
      FROM public.company_members cm
      WHERE cm.user_profile_id = (
        SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1
      )
    ),
    ARRAY[]::uuid[]
  );
$$;

-- is_super_admin() — verifica se o usuário logado é super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin
     FROM public.user_profiles
     WHERE auth_user_id = auth.uid()
     LIMIT 1),
    false
  );
$$;

-- is_super_admin_by_sub() — versão que recebe o sub (uuid string) do JWT
-- Necessário para políticas que existem no banco; aqui é definida de forma segura
CREATE OR REPLACE FUNCTION public.is_super_admin_by_sub(p_sub text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin
     FROM public.user_profiles
     WHERE auth_user_id = p_sub::uuid
     LIMIT 1),
    false
  );
$$;

-- ============================================================
-- PARTE 2: CORRIGIR FK DUPLICADO EM user_profiles
-- user_profiles tem dois FKs para auth.users na mesma coluna:
--   fk_auth_user       → ON DELETE CASCADE   (manter este)
--   fk_userprofiles_authuser → ON DELETE SET NULL (remover — conflito)
-- ============================================================

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS fk_userprofiles_authuser;

-- ============================================================
-- PARTE 3: LIMPAR E RECRIAR POLÍTICAS — company_members
-- CAUSA PRINCIPAL DA RECURSÃO INFINITA
-- ============================================================

-- Remover todas as políticas atuais (incluindo a permissiva "todos_podem_acessar")
DROP POLICY IF EXISTS "company_members_select"         ON public.company_members;
DROP POLICY IF EXISTS "company_members_select_self"    ON public.company_members;
DROP POLICY IF EXISTS "company_members_insert"         ON public.company_members;
DROP POLICY IF EXISTS "company_members_update"         ON public.company_members;
DROP POLICY IF EXISTS "company_members_delete"         ON public.company_members;
DROP POLICY IF EXISTS "company_members_manage"         ON public.company_members;
DROP POLICY IF EXISTS "todos_podem_acessar"            ON public.company_members;
DROP POLICY IF EXISTS "service_role_all_company_members"         ON public.company_members;
DROP POLICY IF EXISTS "service_role_bypass_company_members"      ON public.company_members;
DROP POLICY IF EXISTS "service_role_company_members_insert"      ON public.company_members;
DROP POLICY IF EXISTS "service_role_company_members_select"      ON public.company_members;
DROP POLICY IF EXISTS "service_role_full_access_company_members" ON public.company_members;

-- Recriar políticas limpas (get_my_company_ids agora tem row_security=off → sem recursão)
CREATE POLICY "company_members_select" ON public.company_members
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR user_profile_id = get_my_profile_id()
    OR company_id = ANY (get_my_company_ids())
  );

CREATE POLICY "company_members_insert" ON public.company_members
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin()
    OR company_id = ANY (get_my_company_ids())
  );

CREATE POLICY "company_members_update" ON public.company_members
  FOR UPDATE TO authenticated
  USING (
    is_super_admin()
    OR company_id = ANY (get_my_company_ids())
  );

CREATE POLICY "company_members_delete" ON public.company_members
  FOR DELETE TO authenticated
  USING (
    is_super_admin()
    OR company_id = ANY (get_my_company_ids())
  );

-- service_role bypassa RLS (backend Spring Boot usa postgres → já bypassa, mas mantemos explícito)
CREATE POLICY "service_role_all_company_members" ON public.company_members
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PARTE 4: LIMPAR E RECRIAR POLÍTICAS — companies
-- ============================================================

DROP POLICY IF EXISTS "Admins can update companies"          ON public.companies;
DROP POLICY IF EXISTS "Allow read companies"                 ON public.companies;
DROP POLICY IF EXISTS "Allow read companies for anon"        ON public.companies;
DROP POLICY IF EXISTS "Allow read companies for authenticated" ON public.companies;
DROP POLICY IF EXISTS "Anon can read companies"              ON public.companies;
DROP POLICY IF EXISTS "Anyone can read companies"            ON public.companies;
DROP POLICY IF EXISTS "Anyone can read companies (anon)"     ON public.companies;
DROP POLICY IF EXISTS "Authenticated can create companies"   ON public.companies;
DROP POLICY IF EXISTS "Public read access to companies"      ON public.companies;
DROP POLICY IF EXISTS "companies_delete"                     ON public.companies;
DROP POLICY IF EXISTS "companies_insert"                     ON public.companies;
DROP POLICY IF EXISTS "companies_insert_by_super_admin"      ON public.companies;
DROP POLICY IF EXISTS "companies_insert_super_admin"         ON public.companies;
DROP POLICY IF EXISTS "companies_select"                     ON public.companies;
DROP POLICY IF EXISTS "companies_select_for_members"         ON public.companies;
DROP POLICY IF EXISTS "companies_super_admin"                ON public.companies;
DROP POLICY IF EXISTS "companies_update"                     ON public.companies;
DROP POLICY IF EXISTS "companies_update_by_admins"           ON public.companies;
DROP POLICY IF EXISTS "service_role_all_companies"           ON public.companies;
DROP POLICY IF EXISTS "service_role_bypass_companies"        ON public.companies;
DROP POLICY IF EXISTS "service_role_companies_insert"        ON public.companies;
DROP POLICY IF EXISTS "service_role_companies_select"        ON public.companies;
DROP POLICY IF EXISTS "service_role_full_access_companies"   ON public.companies;
DROP POLICY IF EXISTS "super_admin_all_companies"            ON public.companies;
DROP POLICY IF EXISTS "super_admin_jwt_companies"            ON public.companies;

-- SELECT: qualquer authenticated pode ver empresas das quais é membro (lista de seleção na tela)
-- anon também pode ler para a tela de login mostrar empresas disponíveis
CREATE POLICY "companies_select_anon" ON public.companies
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "companies_select" ON public.companies
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR id = ANY (get_my_company_ids())
  );

-- INSERT: apenas super_admin pode criar empresa
CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin());

-- UPDATE: super_admin ou admin da empresa
CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE TO authenticated
  USING (
    is_super_admin()
    OR (
      id = ANY (get_my_company_ids())
      AND EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.company_id = companies.id
          AND cm.user_profile_id = get_my_profile_id()
          AND cm.role IN ('ADMIN', 'SUPER_ADMIN')
      )
    )
  );

-- DELETE: apenas super_admin
CREATE POLICY "companies_delete" ON public.companies
  FOR DELETE TO authenticated
  USING (is_super_admin());

CREATE POLICY "service_role_all_companies" ON public.companies
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PARTE 5: LIMPAR E RECRIAR POLÍTICAS — chats
-- ============================================================

DROP POLICY IF EXISTS "Members can read chats"               ON public.chats;
DROP POLICY IF EXISTS "chats_all_auth"                       ON public.chats;
DROP POLICY IF EXISTS "chats_delete"                         ON public.chats;
DROP POLICY IF EXISTS "chats_delete_members"                 ON public.chats;
DROP POLICY IF EXISTS "chats_insert"                         ON public.chats;
DROP POLICY IF EXISTS "chats_insert_members"                 ON public.chats;
DROP POLICY IF EXISTS "chats_manage_by_admins"               ON public.chats;
DROP POLICY IF EXISTS "chats_select"                         ON public.chats;
DROP POLICY IF EXISTS "chats_select_public_or_private_member" ON public.chats;
DROP POLICY IF EXISTS "chats_update"                         ON public.chats;
DROP POLICY IF EXISTS "chats_update_members"                 ON public.chats;
DROP POLICY IF EXISTS "service_role_all_chats"               ON public.chats;
DROP POLICY IF EXISTS "service_role_bypass"                  ON public.chats;
DROP POLICY IF EXISTS "service_role_chats_insert"            ON public.chats;
DROP POLICY IF EXISTS "service_role_chats_select"            ON public.chats;
DROP POLICY IF EXISTS "service_role_full_access_chats"       ON public.chats;
DROP POLICY IF EXISTS "super_admin_all_chats"                ON public.chats;
DROP POLICY IF EXISTS "super_admin_jwt_chats"                ON public.chats;

CREATE POLICY "chats_select" ON public.chats
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR (
      company_id = ANY (get_my_company_ids())
      AND (
        is_private = false
        OR EXISTS (
          SELECT 1 FROM public.chat_members cm
          WHERE cm.chat_id = chats.id
            AND cm.user_profile_id = get_my_profile_id()
        )
      )
    )
  );

CREATE POLICY "chats_insert" ON public.chats
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin()
    OR company_id = ANY (get_my_company_ids())
  );

CREATE POLICY "chats_update" ON public.chats
  FOR UPDATE TO authenticated
  USING (
    is_super_admin()
    OR (
      company_id = ANY (get_my_company_ids())
      AND EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.company_id = chats.company_id
          AND cm.user_profile_id = get_my_profile_id()
          AND cm.role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
      )
    )
  );

CREATE POLICY "chats_delete" ON public.chats
  FOR DELETE TO authenticated
  USING (
    is_super_admin()
    OR (
      company_id = ANY (get_my_company_ids())
      AND EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.company_id = chats.company_id
          AND cm.user_profile_id = get_my_profile_id()
          AND cm.role IN ('ADMIN', 'SUPER_ADMIN')
      )
    )
  );

CREATE POLICY "service_role_all_chats" ON public.chats
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PARTE 6: LIMPAR E RECRIAR POLÍTICAS — chat_members
-- ============================================================

DROP POLICY IF EXISTS "chat_members_all_auth"                    ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_delete"                      ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_insert"                      ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_manage"                      ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_read"                        ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_read_access"                 ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_select"                      ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_update"                      ON public.chat_members;
DROP POLICY IF EXISTS "service_role_all_chat_members"            ON public.chat_members;
DROP POLICY IF EXISTS "service_role_full_access_chat_members"    ON public.chat_members;
DROP POLICY IF EXISTS "super_admin_all_chat_members"             ON public.chat_members;
DROP POLICY IF EXISTS "super_admin_jwt_chat_members"             ON public.chat_members;

CREATE POLICY "chat_members_select" ON public.chat_members
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR user_profile_id = get_my_profile_id()
    OR EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_members.chat_id
        AND c.company_id = ANY (get_my_company_ids())
    )
  );

CREATE POLICY "chat_members_insert" ON public.chat_members
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_members.chat_id
        AND c.company_id = ANY (get_my_company_ids())
    )
  );

CREATE POLICY "chat_members_update" ON public.chat_members
  FOR UPDATE TO authenticated
  USING (
    is_super_admin()
    OR user_profile_id = get_my_profile_id()
  );

CREATE POLICY "chat_members_delete" ON public.chat_members
  FOR DELETE TO authenticated
  USING (
    is_super_admin()
    OR user_profile_id = get_my_profile_id()
    OR EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_members.chat_id
        AND c.company_id = ANY (get_my_company_ids())
        AND EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = c.company_id
            AND cm.user_profile_id = get_my_profile_id()
            AND cm.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    )
  );

CREATE POLICY "service_role_all_chat_members" ON public.chat_members
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PARTE 7: LIMPAR E RECRIAR POLÍTICAS — departments
-- ============================================================

DROP POLICY IF EXISTS "Members can read departments"         ON public.departments;
DROP POLICY IF EXISTS "departments_all_auth"                 ON public.departments;
DROP POLICY IF EXISTS "departments_delete"                   ON public.departments;
DROP POLICY IF EXISTS "departments_delete_members"           ON public.departments;
DROP POLICY IF EXISTS "departments_insert"                   ON public.departments;
DROP POLICY IF EXISTS "departments_insert_members"           ON public.departments;
DROP POLICY IF EXISTS "departments_manage_by_admins"         ON public.departments;
DROP POLICY IF EXISTS "departments_select"                   ON public.departments;
DROP POLICY IF EXISTS "departments_select_for_company"       ON public.departments;
DROP POLICY IF EXISTS "departments_update"                   ON public.departments;
DROP POLICY IF EXISTS "departments_update_members"           ON public.departments;
DROP POLICY IF EXISTS "service_role_all_departments"         ON public.departments;
DROP POLICY IF EXISTS "service_role_bypass_departments"      ON public.departments;
DROP POLICY IF EXISTS "service_role_departments_insert"      ON public.departments;
DROP POLICY IF EXISTS "service_role_departments_select"      ON public.departments;
DROP POLICY IF EXISTS "service_role_full_access_departments" ON public.departments;
DROP POLICY IF EXISTS "super_admin_all_departments"          ON public.departments;
DROP POLICY IF EXISTS "super_admin_jwt_departments"          ON public.departments;

CREATE POLICY "departments_select" ON public.departments
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR company_id = ANY (get_my_company_ids())
  );

CREATE POLICY "departments_insert" ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin()
    OR (
      company_id = ANY (get_my_company_ids())
      AND EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.company_id = departments.company_id
          AND cm.user_profile_id = get_my_profile_id()
          AND cm.role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
      )
    )
  );

CREATE POLICY "departments_update" ON public.departments
  FOR UPDATE TO authenticated
  USING (
    is_super_admin()
    OR (
      company_id = ANY (get_my_company_ids())
      AND EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.company_id = departments.company_id
          AND cm.user_profile_id = get_my_profile_id()
          AND cm.role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
      )
    )
  );

CREATE POLICY "departments_delete" ON public.departments
  FOR DELETE TO authenticated
  USING (
    is_super_admin()
    OR (
      company_id = ANY (get_my_company_ids())
      AND EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.company_id = departments.company_id
          AND cm.user_profile_id = get_my_profile_id()
          AND cm.role IN ('ADMIN', 'SUPER_ADMIN')
      )
    )
  );

CREATE POLICY "service_role_all_departments" ON public.departments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PARTE 8: LIMPAR E RECRIAR POLÍTICAS — department_members
-- ============================================================

DROP POLICY IF EXISTS "department_members_manage"                ON public.department_members;
DROP POLICY IF EXISTS "department_members_select"                ON public.department_members;
DROP POLICY IF EXISTS "service_role_department_members_insert"   ON public.department_members;
DROP POLICY IF EXISTS "service_role_department_members_select"   ON public.department_members;

CREATE POLICY "department_members_select" ON public.department_members
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.departments d
      WHERE d.id = department_members.department_id
        AND d.company_id = ANY (get_my_company_ids())
    )
  );

CREATE POLICY "department_members_insert" ON public.department_members
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.departments d
      JOIN public.company_members cm ON cm.company_id = d.company_id
      WHERE d.id = department_members.department_id
        AND cm.user_profile_id = get_my_profile_id()
        AND cm.role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "department_members_update" ON public.department_members
  FOR UPDATE TO authenticated
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.departments d
      JOIN public.company_members cm ON cm.company_id = d.company_id
      WHERE d.id = department_members.department_id
        AND cm.user_profile_id = get_my_profile_id()
        AND cm.role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "department_members_delete" ON public.department_members
  FOR DELETE TO authenticated
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.departments d
      JOIN public.company_members cm ON cm.company_id = d.company_id
      WHERE d.id = department_members.department_id
        AND cm.user_profile_id = get_my_profile_id()
        AND cm.role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "service_role_all_department_members" ON public.department_members
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PARTE 9: LIMPAR E RECRIAR POLÍTICAS — messages
-- ============================================================

DROP POLICY IF EXISTS "messages_all_auth"               ON public.messages;
DROP POLICY IF EXISTS "messages_delete"                  ON public.messages;
DROP POLICY IF EXISTS "messages_insert"                  ON public.messages;
DROP POLICY IF EXISTS "messages_insert_access"           ON public.messages;
DROP POLICY IF EXISTS "messages_insert_authenticated"    ON public.messages;
DROP POLICY IF EXISTS "messages_insert_company_chats"    ON public.messages;
DROP POLICY IF EXISTS "messages_select"                  ON public.messages;
DROP POLICY IF EXISTS "messages_update"                  ON public.messages;
DROP POLICY IF EXISTS "service_role_all_messages"        ON public.messages;

CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id
        AND c.company_id = ANY (get_my_company_ids())
        AND (
          c.is_private = false
          OR EXISTS (
            SELECT 1 FROM public.chat_members cm
            WHERE cm.chat_id = c.id
              AND cm.user_profile_id = get_my_profile_id()
          )
        )
    )
  );

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_profile_id = get_my_profile_id()
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id
        AND c.company_id = ANY (get_my_company_ids())
        AND (
          c.is_private = false
          OR EXISTS (
            SELECT 1 FROM public.chat_members cm
            WHERE cm.chat_id = c.id
              AND cm.user_profile_id = get_my_profile_id()
          )
        )
    )
  );

CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    is_super_admin()
    OR user_profile_id = get_my_profile_id()
  );

CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE TO authenticated
  USING (
    is_super_admin()
    OR user_profile_id = get_my_profile_id()
  );

CREATE POLICY "service_role_all_messages" ON public.messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PARTE 10: ADICIONAR POLÍTICAS FALTANTES — tickets
-- (não existiam no banco → causa do erro na tela ticket/[id])
-- ============================================================

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tickets_select"          ON public.tickets;
DROP POLICY IF EXISTS "tickets_insert"          ON public.tickets;
DROP POLICY IF EXISTS "tickets_update"          ON public.tickets;
DROP POLICY IF EXISTS "tickets_delete"          ON public.tickets;
DROP POLICY IF EXISTS "service_role_all_tickets" ON public.tickets;

CREATE POLICY "tickets_select" ON public.tickets
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR company_id = ANY (get_my_company_ids())
  );

CREATE POLICY "tickets_insert" ON public.tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin()
    OR company_id = ANY (get_my_company_ids())
  );

CREATE POLICY "tickets_update" ON public.tickets
  FOR UPDATE TO authenticated
  USING (
    is_super_admin()
    OR (
      company_id = ANY (get_my_company_ids())
      AND (
        creator_profile_id = get_my_profile_id()
        OR assignee_profile_id = get_my_profile_id()
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = tickets.company_id
            AND cm.user_profile_id = get_my_profile_id()
            AND cm.role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
        )
      )
    )
  );

CREATE POLICY "tickets_delete" ON public.tickets
  FOR DELETE TO authenticated
  USING (
    is_super_admin()
    OR (
      company_id = ANY (get_my_company_ids())
      AND EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.company_id = tickets.company_id
          AND cm.user_profile_id = get_my_profile_id()
          AND cm.role IN ('ADMIN', 'SUPER_ADMIN')
      )
    )
  );

CREATE POLICY "service_role_all_tickets" ON public.tickets
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PARTE 11: ADICIONAR POLÍTICAS FALTANTES — ticket_comments
-- ============================================================

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ticket_comments_select"           ON public.ticket_comments;
DROP POLICY IF EXISTS "ticket_comments_insert"           ON public.ticket_comments;
DROP POLICY IF EXISTS "ticket_comments_update"           ON public.ticket_comments;
DROP POLICY IF EXISTS "ticket_comments_delete"           ON public.ticket_comments;
DROP POLICY IF EXISTS "service_role_all_ticket_comments" ON public.ticket_comments;

CREATE POLICY "ticket_comments_select" ON public.ticket_comments
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_comments.ticket_id
        AND t.company_id = ANY (get_my_company_ids())
    )
  );

CREATE POLICY "ticket_comments_insert" ON public.ticket_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    user_profile_id = get_my_profile_id()
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_comments.ticket_id
        AND t.company_id = ANY (get_my_company_ids())
    )
  );

CREATE POLICY "ticket_comments_update" ON public.ticket_comments
  FOR UPDATE TO authenticated
  USING (
    is_super_admin()
    OR user_profile_id = get_my_profile_id()
  );

CREATE POLICY "ticket_comments_delete" ON public.ticket_comments
  FOR DELETE TO authenticated
  USING (
    is_super_admin()
    OR user_profile_id = get_my_profile_id()
  );

CREATE POLICY "service_role_all_ticket_comments" ON public.ticket_comments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PARTE 12: GARANTIR POLÍTICAS MÍNIMAS — user_profiles
-- O backend cria perfis via service_role (bypassa RLS).
-- Aqui garantimos que usuários authenticated podem ler e
-- atualizar apenas o próprio perfil.
-- ============================================================

-- Remover possíveis permissivas antigas (verificar nome real se houver)
DROP POLICY IF EXISTS "user_profiles_select"         ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert"         ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update"         ON public.user_profiles;
DROP POLICY IF EXISTS "service_role_all_user_profiles" ON public.user_profiles;

-- SELECT: veja o próprio perfil; super_admin vê todos; membros da mesma empresa podem ver uns aos outros
CREATE POLICY "user_profiles_select" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR auth_user_id = auth.uid()
    OR id IN (
      SELECT cm2.user_profile_id
      FROM public.company_members cm2
      WHERE cm2.company_id = ANY (get_my_company_ids())
    )
  );

-- INSERT: cada usuário pode criar apenas o próprio perfil (auth_user_id = uid)
CREATE POLICY "user_profiles_insert" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- UPDATE: apenas o próprio perfil (exceto super_admin)
CREATE POLICY "user_profiles_update" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    is_super_admin()
    OR auth_user_id = auth.uid()
  );

-- service_role: acesso total (backend Spring Boot cria/atualiza perfis)
CREATE POLICY "service_role_all_user_profiles" ON public.user_profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PARTE 13: DROPAR POLÍTICAS ÓRFÃS QUE USAM is_super_admin_by_sub
-- (já substituídas por políticas limpas acima)
-- Verificar e remover apenas as que ainda existirem
-- ============================================================

-- Estes drops são seguros: se a policy não existir, IF EXISTS evita erro
DROP POLICY IF EXISTS "super_admin_all_chat_members"  ON public.chat_members;
DROP POLICY IF EXISTS "super_admin_jwt_chat_members"  ON public.chat_members;
DROP POLICY IF EXISTS "super_admin_all_chats"         ON public.chats;
DROP POLICY IF EXISTS "super_admin_jwt_chats"         ON public.chats;
DROP POLICY IF EXISTS "super_admin_all_companies"     ON public.companies;
DROP POLICY IF EXISTS "super_admin_jwt_companies"     ON public.companies;
DROP POLICY IF EXISTS "super_admin_all_departments"   ON public.departments;
DROP POLICY IF EXISTS "super_admin_jwt_departments"   ON public.departments;

-- Remover policies com current_setting (abordagem não-padrão, pode falhar)
DROP POLICY IF EXISTS "service_role_full_access_chat_members"  ON public.chat_members;
DROP POLICY IF EXISTS "service_role_full_access_chats"         ON public.chats;
DROP POLICY IF EXISTS "service_role_full_access_companies"     ON public.companies;
DROP POLICY IF EXISTS "service_role_full_access_departments"   ON public.departments;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- Execute para confirmar que não há mais recursão:
-- ============================================================
-- SELECT get_my_company_ids();
-- SELECT * FROM public.company_members LIMIT 1;
-- SELECT * FROM public.tickets LIMIT 1;
