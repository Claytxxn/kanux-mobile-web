# Kanux - CHANGELOG

## Resumo Geral
O projeto Kanux passou por uma migração significativa de Next.js + Supabase para uma arquitetura híbrida com **Spring Boot Backend (Java)** + **Supabase PostgreSQL** mantendo os frontends Web (Next.js) e Mobile (Expo/React Native). Abaixo está a documentação completa das atualizações implementadas e status atual.

## 📋 Atualizações Implementadas (Completas ✅)

### 1. **Backend Spring Boot (Nova Implementação)**
```
✅ Backend Java compilando com sucesso
✅ Conexão com Supabase PostgreSQL via JDBC
✅ Entities JPA (Ticket, Message, Company, Profile, etc.)
✅ Repositories JPA/Hibernate
✅ Controllers REST implementados:
  - /api/auth/login (JWT)
  - /api/admin/companies (CRUD)
  - /api/tickets (CRUD completo)
  - /api/chats (básico)
  - /api/admin/members (atualizar role)
  - /api/profile (update perfil)
✅ Configuração Security (JWT Auth Filter)
✅ Flyway migrations para schema Supabase
✅ application.yml com env vars (DB_URL, JWT_SECRET, etc.)
✅ DockerFile para containerização backend
```

### 2. **Super Admin Completo**
```
✅ Web Admin (/admin):
  - Dashboard global (todas empresas)
  - CRUD Empresas
  - Gerenciar membros (add/remove/update role)
  - Convidar usuários por email
  - Criar chats e departamentos
  - Ver todos tickets globalmente

✅ Mobile Admin:
  - Tela Admin com seletor de empresa
  - Stats por empresa
  - Gerenciar membros/chats/departamentos
  - Badge Super Admin no perfil/home
```

### 3. **Correções Mobile**
```
✅ mobile/app/(tabs)/tickets.tsx - Caminhos de import corrigidos:
  De: '../src/contexts/AuthContext'
  Para: '../../src/contexts/AuthContext'
✅ Verificados e corretos:
  - Todos tabs (_layout, index, profile, chats, tickets)
  - Admin screens
  - Company select
  - Ticket create/chat views
```

### 4. **Segurança & Configurações**
```
✅ .gitignore atualizado:
  - .env* files
  - target/ (Java)
  - node_modules/
  - Security keys/certificates
✅ application.yml usa ${env vars} ao invés de hardcoded
✅ TODO.md: Config .env secrets ✅ Concluído
```

### 5. **Commits Recentes**
```
ac65dd4 add dockerfile backend
d5713d1 remove pasta temporaria do supabase  
0a219e8 Update .gitignore for security (blackboxai)
```

## ⏳ Em Andamento / Pendências

### Backend APIs Faltando
```
⏳ /api/companies (usuário comum - suas companies)
⏳ /api/chats (completo)
⏳ /api/admin/invite-user
⏳ Testes completos
```

### Migração Frontend
```
⏳ Web/Mobile: 
  - Update baseURL para backend Spring (localhost:8080)
  - Testar todas APIs migradas
  - Remover Supabase direct client (usar backend proxy)
  - Sync offline ajustado
```

### SQL Migrations Supabase (Aplicar)
```
📁 web/sql/ - Múltiplos fix_rls.sql, fix_permissions.sql
📁 web/sql/ - test_chat_creation.sql, supabase_full_schema.sql
```

## 🚀 Como Testar

### Backend
```bash
cd backend && mvn spring-boot:run
# Test login
curl -X POST http://localhost:8080/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@test.com","password":"test"}'
```

### Frontend
```bash
# Web
cd web && npm run dev

# Mobile
cd mobile && npx expo start
```

## 📁 Arquivos Principais Modificados
- `backend/` - Completo (entities, controllers, config)
- `Dockerfile` - Backend container
- `.gitignore` - Security updates
- `application.yml` - Env vars
- `mobile/app/(tabs)/tickets.tsx` - Imports fix
- `TODO.md`, `PLAN.md`, `KANUX_SUMMARY.md` - Tracking

---
*Última atualização: `git log -1 --pretty=format:%h %s %ad`*
*Gerado automaticamente via BLACKBOXAI*
