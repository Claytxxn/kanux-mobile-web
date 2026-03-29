-- =====================================================
-- CORREÇÃO DE PERMISSÕES DO ESQUEMA PÚBLICO
-- Execute no Supabase SQL Editor
-- =====================================================

-- 1) Garantir que o esquema public está no search_path
ALTER DATABASE SET search_path TO "$user", public;

-- 2) Conceder permissões no esquema public para o role authenticated
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

-- 3) Conced todas as tabeler permissões emas existentes
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO anon;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO anon;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO anon;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO service_role;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO service_role;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- 4) Conceder permissões em todas as sequências
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 5) Definir permissões padrão para futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT UPDATE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT DELETE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT UPDATE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT DELETE ON TABLES TO service_role;

-- 6) Conceder EXECUTE em todas as funções
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- =====================================================
-- FIM
-- =====================================================
