-- Seed: cria super admin inicial.
-- IMPORTANTE: troque o auth_user_id pelo UUID real do seu usuário no Supabase
-- Supabase Dashboard -> Authentication -> Users -> copie o UUID do usuário admin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE email = 'admin@kanux.com') THEN
        INSERT INTO user_profiles (auth_user_id, display_name, email, is_super_admin)
        VALUES ('00000000-0000-0000-0000-000000000001'::UUID, 'Super Admin', 'admin@kanux.com', TRUE);
    END IF;
END $$;
