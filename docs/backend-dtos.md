# DTOs do Backend Kanux

## Visão Geral
DTOs (Data Transfer Objects) são usados para transportar dados entre o backend e o frontend via WebSocket ou REST. Devem ser tipados, imutáveis e refletir exatamente o payload esperado em cada canal.

---

## Localização
- `backend/src/main/java/com/kanux/ws/dto/`

---

## Exemplos de DTOs

```java
// Exemplo: ChatDTO.java
public class ChatDTO {
    public String id;
    public String name;
    public String companyId;
    public List<MessageDTO> messages;
}

// Exemplo: MessageDTO.java
public class MessageDTO {
    public String id;
    public String chatId;
    public String userProfileId;
    public String content;
    public String messageType;
    public String mediaUrl;
    public String mediaName;
    public String createdAt;
}
```

---

## Observações
- Sempre que criar ou alterar um DTO, atualizar este arquivo.
- Para cada canal WebSocket, documentar o DTO esperado no `backend-websocket.md`.
- DTOs devem ser serializáveis e não conter lógica de negócio.

---

## Histórico de Alterações
- 2026-05-23: Documentação inicial dos principais DTOs.
