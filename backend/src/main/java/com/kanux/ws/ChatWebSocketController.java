package com.kanux.ws;

import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.simp.annotation.SendToUser;
import java.security.Principal;
import java.util.List;
import com.kanux.ws.dto.ChatDTO;
import com.kanux.ws.dto.MessageDTO;
import java.util.ArrayList;
import java.util.Objects;

@Controller("chatWebSocketControllerWs")
public class ChatWebSocketController {
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Solicita lista de chats
    @MessageMapping("/chats.list")
    @SendToUser("/topic/chats")
    public List<ChatDTO> listChats(@Payload(required = false) ChatDTO req, Principal principal) {
        return new ArrayList<>();
    }

    // Cria novo chat
    @MessageMapping("/chat.create")
    public void createChat(@Payload ChatDTO req, Principal principal) {
        messagingTemplate.convertAndSend("/topic/chats", Objects.requireNonNull(req));
    }

    // Solicita histórico de mensagens
    @MessageMapping("/chat.{chatId}.messages.list")
    @SendToUser("/topic/chat.{chatId}.messages")
    public List<MessageDTO> listMessages(@DestinationVariable String chatId, Principal principal) {
        return new ArrayList<>();
    }

    // Envia mensagem
    @MessageMapping("/chat.{chatId}.message.send")
    public void sendMessage(@DestinationVariable String chatId, @Payload MessageDTO msg, Principal principal) {
        messagingTemplate.convertAndSend("/topic/chat." + chatId + ".messages", Objects.requireNonNull(msg));
    }
}
