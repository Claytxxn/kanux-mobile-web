-- =====================================================
-- KANUX: Teste de criação de chat
-- Use este script para verificar se as políticas RLS estão funcionando
-- =====================================================

-- 1. Verificar se as políticas de service_role existem
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('chats', 'chat_members', 'messages')
    AND 'service_role'::name = ANY(roles)
ORDER BY tablename, policyname;

-- 2. Verificar se RLS está habilitado nas tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('chats', 'chat_members', 'messages');

-- 3. Testar se um usuário autenticado pode criar chat (simulação)
-- Nota: Este teste só funciona quando executado via API com service_role

-- 4. Verificar GRANTs
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'service_role'
    AND table_schema = 'public'
    AND table_name IN ('chats', 'chat_members', 'messages')
ORDER BY table_name, privilege_type;
