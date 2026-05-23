# Integração WebSocket no Frontend

## Visão Geral
O frontend (mobile e web) utiliza WebSocket (STOMP) para comunicação em tempo real com o backend. Todos os fluxos críticos (mensagens, tickets, comentários) devem usar canais WebSocket, eliminando REST progressivamente.

---

## Mobile (React Native)
- `src/contexts/WebSocketContext.tsx`: Provider global, gerencia conexão, subscriptions e envio de mensagens/tickets/comentários.
- `src/contexts/SyncContext.tsx`: Sincronização automática da fila offline via WebSocket.
- `src/lib/api.ts`: Detecção dinâmica do endpoint backend.

### Principais métodos WebSocket
- `sendMessageWs(chatId, content, ...)`
- `sendTicketCommentWs(ticketId, content)`
- `createTicketWs(data, onResult)`
- `subscribeChatMessages(chatId, listener)`

---

## Web (Next.js)
- Integração WebSocket planejada para substituir REST.
- Documentar canais e handlers ao implementar.

---

## Observações
- Sempre que alterar canais, subscriptions ou lógica de envio, atualizar esta nota.
- Para cada novo canal, alinhar com `backend-websocket.md`.

---

## Histórico de Alterações
- 2026-05-23: Documentação inicial da integração WebSocket frontend.
