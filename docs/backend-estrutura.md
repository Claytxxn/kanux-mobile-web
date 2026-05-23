# Estrutura do Backend Kanux

## Visão Geral
O backend do Kanux é construído em Spring Boot, estruturado para suportar comunicação WebSocket (STOMP/SockJS) e REST (em transição para 100% WebSocket). Abaixo, a estrutura dos principais diretórios e arquivos.

---

## Estrutura de Pastas

```
backend/
  src/
    main/
      java/
        com/kanux/
          ws/                  # Controllers WebSocket
            ApiWebSocketController.java
            ChatWebSocketController.java
          config/              # Configurações (WebSocket, JWT, etc)
          security/            # Serviços de autenticação JWT
          controller/          # REST controllers (legado)
          dto/                 # Data Transfer Objects
      resources/
        application.yml        # Configuração Spring Boot
    test/
      java/                   # Testes automatizados
  pom.xml                     # Dependências Maven
```

---

## Principais Arquivos

- **ApiWebSocketController.java**: Handlers WebSocket para todos os recursos principais.
- **ChatWebSocketController.java**: Handlers WebSocket específicos para chats/mensagens.
- **WebSocketConfig.java**: Configuração de endpoints, autenticação JWT no handshake, interceptors.
- **JwtService.java**: Validação e extração de claims do token JWT.
- **pom.xml**: Gerenciamento de dependências (Spring Boot, STOMP, etc).

---

## Observações
- Sempre que criar ou alterar arquivos nesta estrutura, atualizar esta nota.
- Para handlers/canais, detalhar no arquivo `backend-websocket.md`.
- Para DTOs, criar/atualizar `backend-dtos.md`.

---

## Histórico de Alterações
- 2026-05-23: Estrutura inicial documentada.
