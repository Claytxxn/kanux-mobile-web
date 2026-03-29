# Migração Completa Next.js Supabase → Spring Boot + Supabase DB

## Status Atual
✅ Backend Java compilando
✅ Conexão Supabase PostgreSQL
✅ Entities JPA + Repositories
✅ Controllers básicos (auth, admin/companies, tickets)
✅ JWT Auth

## APIs Implementadas
- POST /api/auth/login
- GET/POST/DELETE /api/admin/companies  
- GET/POST/PUT/DELETE /api/tickets

## Próximas APIs Faltando
```
- /api/companies (usuário comum - suas companies)
- /api/admin/members 
- /api/chats
- /api/profile
- /api/admin/invite-user
```

## Migração Frontend (PENDENTE)
```
Web & Mobile:
1. Mudar baseURL para http://localhost:8080
2. Manter mesma estrutura JSON response
3. Testar todas rotas
4. Remover Supabase client
```

## Testar Backend
```bash
cd backend
mvn spring-boot:run
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}'
```

