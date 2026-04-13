# Plano de Correção - Problemas Android App (Tela Teste + Network Failed)

## Status: ✅ Código Atualizado - Aguardando Backend + Testes

### 1. ✅ Criar/Atualizar TODO.md 
### 2. ✅ Editar mobile/src/lib/api.ts - Porta 10000 adicionada (localhost:10000 + 10.0.2.2:10000)
### 3. ✅ Editar mobile/app/index.tsx - Estado vazio melhorado com aviso backend porta 10000
### 4. ✅ Editar mobile/app/(tabs)/profile.tsx - Texto perfil melhorado
### 5. [PENDENTE] ✅ Iniciar backend: `cd backend && mvn spring-boot:run`
### 6. [PENDENTE] ✅ Testar conectividade: `curl http://localhost:10000/api/verify-company`
### 7. [PENDENTE] ✅ Rebuild app: `cd mobile && npx expo run:android --clear`
### 8. [PENDENTE] ✅ Testar fluxo completo

**Comandos para testar agora:**

1. **Inicie o backend:**
```
cd backend
mvn spring-boot:run
```
(Deve mostrar "Started KanuxApplication in X seconds" na porta 10000)

2. **Teste conectividade:**
```
curl -X POST http://localhost:10000/api/verify-company -H "Content-Type: application/json" -d "{\"slug\":\"test\"}"
```
(Deve retornar JSON com success/error)

3. **Rebuild e teste app:**
```
cd mobile
npx expo run:android --clear
```
(App deve detectar backend auto, carregar empresas sem "network failed")

**Notas:**
- Backend porta: **10000** (application.yml)
- Android emulator: **10.0.2.2:10000**
- Supabase ✅ Config OK
- Arquivos editados salvos ✅

**Próximo:** Execute comandos acima e teste. Se erro persiste, cole logs backend/app.


