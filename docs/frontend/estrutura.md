# Estrutura do Frontend Kanux

## Visão Geral
O frontend do Kanux é composto por dois projetos principais:
- **mobile/**: App React Native (Expo), com suporte offline, cache e sincronização automática.
- **web/**: App Next.js, interface web progressiva.

---

## Estrutura de Pastas

```
mobile/
  src/
    components/         # Componentes reutilizáveis
    contexts/           # Contextos globais (Auth, WebSocket, Sync, etc)
    lib/                # Funções utilitárias, cache, API
    app/                # Navegação e telas principais
  assets/               # Imagens, ícones
  ios/                  # Projeto iOS (Expo)
  ...

web/
  src/
    components/         # Componentes React
    lib/                # Funções utilitárias, API
    supabase/           # Migrations e integração
  app/                  # Rotas e páginas Next.js
  public/               # Assets públicos
```

---

## Observações
- Sempre que criar ou alterar arquivos, atualizar esta nota.
- Para fluxos offline/sync, detalhar em `frontend/offline-sync.md`.
- Para canais WebSocket, detalhar em `backend-websocket.md`.

---

## Histórico de Alterações
- 2026-05-23: Estrutura inicial documentada.
