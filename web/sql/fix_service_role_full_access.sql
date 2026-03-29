-- =====================================================
-- KANUX: Garantir acesso total para service_role
-- Execute no Supabase SQL Editor
-- =====================================================

-- 1) Primeiro, garantir que service_role pode usar o esquema
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- 2) Permissões em todas as tabelas para service_role
GRANT ALL ON TABLE public.chats TO service_role;
GRANT ALL ON TABLE public.chat_members TO service_role;
GRANT ALL ON TABLE public.messages TO service_role;
GRANT ALL ON TABLE public.companies TO service_role;
GRANT ALL ON TABLE public.company_members TO service_role;
GRANT ALL ON TABLE public.departments TO service_role;
GRANT ALL ON TABLE public.user_profiles TO service_role;
GRANT ALL ON TABLE public.tickets TO service_role;
GRANT ALL ON TABLE public.ticket_comments TO service_role;
GRANT ALL ON TABLE public.attachments TO service_role;
GRANT ALL ON TABLE public.audit_logs TO service_role;

-- 3) Permissões em sequências
GRANT ALL ON SEQUENCE public.company_number_seq TO service_role;

-- 4) Permissões em funções
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 5) Verificar se RLS está habilitado e criar políticas específicas para service_role
-- Esta política permite que service_role faça tudo SEM passar pelo RLS
DO $$
BEGIN
  -- Habilitar RLS se ainda não estiver
  ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
  
  -- Criar política de bypass para service_role em cada tabela
  -- chats
  DROP POLICY IF EXISTS "service_role_full_access_chats" ON public.chats;
  CREATE POLICY "service_role_full_access_chats" ON public.chats
    FOR ALL USING (current_setting('app.current_role', true) = 'service_role');

  -- chat_members
  DROP POLICY IF EXISTS "service_role_full_access_chat_members" ON public.chat_members;
  CREATE POLICY "service_role_full_access_chat_members" ON public.chat_members
    FOR ALL USING (current_setting('app.current_role', true) = 'service_role');

  -- messages
  DROP POLICY IF EXISTS "service_role_full_access_messages" ON public.messages;
  CREATE POLICY "service_role_full_access_messages" ON public.messages
    FOR ALL USING (current_setting('app.current_role', true) = 'service_role');

  -- companies
  DROP POLICY IF EXISTS "service_role_full_access_companies" ON public.companies;
  CREATE POLICY "service_role_full_access_companies" ON public.companies
    FOR ALL USING (current_setting('app.current_role', true) = 'service_role');

  -- company_members
  DROP POLICY IF EXISTS "service_role_full_access_company_members" ON public.company_members;
  CREATE POLICY "service_role_full_access_company_members" ON public.company_members
    FOR ALL USING (current_setting('app.current_role', true) = 'service_role');

  -- departments
  DROP POLICY IF EXISTS "service_role_full_access_departments" ON public.departments;
  CREATE POLICY "service_role_full_access_departments" ON public.departments
    FOR ALL USING (current_setting('app.current_role', true) = 'service_role');

  -- user_profiles
  DROP POLICY IF EXISTS "service_role_full_access_user_profiles" ON public.user_profiles;
  CREATE POLICY "service_role_full_access_user_profiles" ON public.user_profiles
    FOR ALL USING (current_setting('app.current_role', true) = 'service_role');

  -- tickets
  DROP POLICY IF EXISTS "service_role_full_access_tickets" ON public.tickets;
  CREATE POLICY "service_role_full_access_tickets" ON public.tickets
    FOR ALL USING (current_setting('app.current_role', true) = 'service_role');

  RAISE NOTICE 'Políticas de service_role criadas com sucesso!';
END
$$;

-- 6) Configurar o papel atual para o Supabase Client
-- Nota: O Supabase JS client com service_role key já tem bypass de RLS automaticamente
-- Mas esta configuração garante compatibilidade

-- 7) Verificar configuração atual
SELECT 
  'chats' as table_name,
  count(*) as rls_policies
FROM pg_policies WHERE tablename = 'chats'
UNION ALL
SELECT 
  'companies',
  count(*)
FROM pg_policies WHERE tablename = 'companies'
UNION ALL
SELECT 
  'user_profiles', 
  count(*)
FROM pg_policies WHERE tablename = 'user_profiles';

-- =====================================================
-- FIM - Execute este script no Supabase SQL Editor
-- =====================================================
