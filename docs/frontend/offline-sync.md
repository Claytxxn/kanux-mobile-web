# Sincronização Offline e Cache (Mobile)

## Visão Geral
O app mobile Kanux implementa cache persistente (SQLite + AsyncStorage) e fila de operações offline, garantindo funcionamento 100% mesmo sem conexão. Ao reconectar, todas as operações pendentes são sincronizadas automaticamente via WebSocket.

---

## Fluxo de Sincronização
1. **Usuário executa ação offline** (ex: envia mensagem, cria ticket)
   - Ação é salva localmente (SQLite/AsyncStorage)
   - Operação é adicionada à fila de pendências
2. **Reconexão detectada**
   - SyncContext lê fila de pendências
   - Tenta enviar cada operação via WebSocket (`sendMessageWs`, `createTicketWs`, etc)
   - Se WebSocket indisponível, faz fallback REST
   - Ao sucesso, remove da fila
3. **Cache atualizado**
   - Dados sincronizados são salvos localmente
   - UI reflete estado atualizado

---

## Principais Arquivos
- `mobile/src/lib/offlineCache.ts`: Camada de cache offline (SQLite/AsyncStorage)
- `mobile/src/lib/offlineStorage.ts`: Fila de pendências, helpers de armazenamento
- `mobile/src/contexts/SyncContext.tsx`: Orquestra sincronização automática
- `mobile/src/contexts/WebSocketContext.tsx`: Métodos de envio WebSocket

---

## Observações
- Sempre que alterar lógica de cache/sync, atualizar esta nota.
- Para novos tipos de operação offline, documentar o fluxo aqui antes de implementar.

---

## Histórico de Alterações
- 2026-05-23: Documentação inicial do fluxo offline/sync.
