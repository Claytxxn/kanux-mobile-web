# Correção do Erro de Permissão ao Criar Chat

## Problema
Ao tentar criar um chat pelo painel admin, ocorre erro de permissão (RLS - Row Level Security).

## Causa
A API `/api/chats` usa a `SUPABASE_SERVICE_ROLE_KEY` para bypassar o RLS, mas as políticas RLS no banco de dados não permitem operações quando `auth.uid()` é null (o que acontece com service role).

## Solução

### Passo 1: Aplicar as políticas RLS para service_role

Execute o arquivo `fix_service_role_rls.sql` no SQL Editor do Supabase:

1. Acesse o dashboard do Supabase
2. Vá em "SQL Editor"
3. Cole o conteúdo de `web/sql/fix_service_role_rls.sql`
4. Execute o script

### Passo 2: Verificar se funcionou

Execute o arquivo `test_chat_creation.sql` para verificar se as políticas foram criadas corretamente.

### O que o script faz

1. **Habilita RLS** nas tabelas `chats`, `chat_members` e `messages`
2. **Remove políticas antigas** de service_role (para evitar conflitos)
3. **Cria novas políticas** `service_role_*_all` que permitem todas as operações (SELECT, INSERT, UPDATE, DELETE) para o role `service_role`
4. **Garante GRANTs** necessários para o service_role

### Políticas criadas

- `service_role_chats_all` - Permite todas as operações na tabela `chats`
- `service_role_chat_members_all` - Permite todas as operações na tabela `chat_members`
- `service_role_messages_all` - Permite todas as operações na tabela `messages`

### Teste

Após aplicar as políticas, tente criar um chat pelo painel admin. O erro de permissão deve ser resolvido.

## Troubleshooting

Se o erro persistir:

1. Verifique se a `SUPABASE_SERVICE_ROLE_KEY` está configurada no `.env.local`
2. Verifique os logs da API em `/api/chats` (console do navegador ou terminal)
3. Execute o script `test_chat_creation.sql` para verificar se as políticas existem
4. Verifique se o RLS está habilitado nas tabelas

## Nota

As políticas para `authenticated` (usuários normais) continuam funcionando normalmente. As políticas de `service_role` são adicionais e só afetam operações feitas via API com a service role key.
