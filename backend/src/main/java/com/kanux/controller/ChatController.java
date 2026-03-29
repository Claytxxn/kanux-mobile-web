package com.kanux.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kanux.dto.ApiResponse;
import com.kanux.dto.CreateChatRequest;
import com.kanux.dto.SendMessageRequest;
import com.kanux.entity.Chat;
import com.kanux.entity.Message;
import com.kanux.entity.UserProfile;
import com.kanux.repository.ChatRepository;
import com.kanux.repository.MessageRepository;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;

    public ChatController(ChatRepository chatRepository, MessageRepository messageRepository) {
        this.chatRepository = chatRepository;
        this.messageRepository = messageRepository;
    }

    @SuppressWarnings("null")
    @GetMapping
    public ResponseEntity<?> getChats(
            @AuthenticationPrincipal UserProfile p,
            @RequestParam(required = false) String companyId,
            @RequestParam(required = false) String chatId) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        if (chatId != null) {
            try {
                return chatRepository.findById(UUID.fromString(chatId))
                        .map(c -> ResponseEntity.ok(ApiResponse.ok(c)))
                        .orElse(ResponseEntity.notFound().build());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(ApiResponse.fail("Invalid chatId format"));
            }
        }
        if (companyId != null)
            return ResponseEntity.ok(ApiResponse.ok(
                    chatRepository.findByCompanyIdOrderByCreatedAtDesc(UUID.fromString(companyId))));
        return ResponseEntity.badRequest().body(ApiResponse.fail("companyId ou chatId é obrigatório"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Chat>> createChat(
            @AuthenticationPrincipal UserProfile p, @RequestBody CreateChatRequest req) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        Chat chat = new Chat();
        chat.setCompanyId(UUID.fromString(req.getCompanyId()));
        if (req.getDepartmentId() != null) chat.setDepartmentId(UUID.fromString(req.getDepartmentId()));
        chat.setName(req.getName());
        chat.setPrivate(req.isPrivate());
        chat.setCreatedBy(p.getId());
        Chat savedChat = chatRepository.save(chat);
        return ResponseEntity.ok(ApiResponse.ok(savedChat));
    }

    @SuppressWarnings("null")
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteChat(
            @AuthenticationPrincipal UserProfile p, @RequestParam String id) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        chatRepository.deleteById(UUID.fromString(id));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMessages(
            @AuthenticationPrincipal UserProfile p, @PathVariable String chatId) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        List<Map<String, Object>> result = messageRepository
                .findByChatIdOrderByCreatedAt(UUID.fromString(chatId))
                .stream().limit(50).map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{chatId}/messages")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendMessage(
            @AuthenticationPrincipal UserProfile p, @PathVariable String chatId,
            @RequestBody SendMessageRequest req) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        if (req.getContent() == null || req.getContent().isBlank())
            return ResponseEntity.badRequest().body(ApiResponse.fail("content é obrigatório"));
        UUID senderId = p.getId();
        if (req.getUserProfileId() != null) {
            try { senderId = UUID.fromString(req.getUserProfileId()); } catch (Exception ignored) {}
        }
        Message message = new Message();
        message.setChatId(UUID.fromString(chatId));
        message.setUserProfileId(senderId);
        message.setContent(req.getContent());
        message.setAttachments("[]");
        Message saved = messageRepository.save(message);
        return ResponseEntity.ok(ApiResponse.ok(toMap(saved)));
    }

    private Map<String, Object> toMap(Message m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId()); map.put("chat_id", m.getChatId());
        map.put("user_profile_id", m.getUserProfileId()); map.put("content", m.getContent());
        map.put("attachments", m.getAttachments()); map.put("created_at", m.getCreatedAt());
        map.put("updated_at", m.getUpdatedAt());

        return map;
    }

}
