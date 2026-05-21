
package com.kanux.config;

import com.kanux.security.JwtService;
import com.kanux.entity.UserProfile;
import com.kanux.repository.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.util.UriComponentsBuilder;

import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebSocketConfig.class);

    private final JwtService jwtService;
    private final UserProfileRepository userProfileRepository;

    public WebSocketConfig(JwtService jwtService, UserProfileRepository userProfileRepository) {
        this.jwtService = jwtService;
        this.userProfileRepository = userProfileRepository;
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        // Endpoint de conexão WebSocket — mobile conecta em /ws
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
            .addInterceptors(authTokenHandshakeInterceptor())
                .withSockJS(); // fallback para ambientes sem WebSocket nativo

  
                // Endpoint puro (sem SockJS) para React Native com @stomp/stompjs
        registry.addEndpoint("/ws-native")
            .setAllowedOriginPatterns("*")
            .addInterceptors(authTokenHandshakeInterceptor());
    }

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
        config.setApplicationDestinationPrefixes("/app");
        // Broker em memória para tópicos e fila de usuário específico
        config.enableSimpleBroker("/topic", "/queue")
            .setHeartbeatValue(new long[]{10000, 10000});
        // Destinos específicos de usuário (notificações privadas)
        config.setUserDestinationPrefix("/user");

        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("ws-heartbeat-");
        scheduler.initialize();

        config.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[]{10000, 10000})
                .setTaskScheduler(scheduler);
    }

    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor == null) return message;

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    log.debug("[WS] CONNECT frame recebido, processando autenticação...");

                    // 1) Prioriza principal obtido no handshake (query param access_token/token)
                    Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                    if (sessionAttributes != null) {
                        Object sessionPrincipal = sessionAttributes.get("wsPrincipal");
                        if (sessionPrincipal instanceof Principal principal) {
                            accessor.setUser(principal);
                            log.info("[WS] ✓ Conexão autenticada via handshake token: {}", principal.getName());
                            return message;
                        }
                    }
                    
                    // 2) Fallback: token JWT via header STOMP Authorization
                    List<String> authHeaders = accessor.getNativeHeader("Authorization");
                    
                    if (authHeaders == null || authHeaders.isEmpty()) {
                        log.warn("[WS] Nenhum header Authorization encontrado na conexão WebSocket");
                        return message;
                    }
                    
                    String header = authHeaders.get(0);
                    if (header == null || !header.startsWith("Bearer ")) {
                        log.warn("[WS] Header Authorization malformado: {}", header != null ? header.substring(0, Math.min(20, header.length())) : "null");
                        return message;
                    }
                    
                    String token = header.substring(7).trim();
                    log.debug("[WS] Token JWT extraído, comprimento: {}", token.length());

                    try {
                        Optional<Principal> principalOptional = authenticateToken(token);
                        if (principalOptional.isPresent()) {
                            Principal principal = principalOptional.get();
                            accessor.setUser(principal);
                            log.info("[WS] ✓ Conexão autenticada com sucesso via STOMP header: {}", principal.getName());
                        } else {
                            log.warn("[WS] ✗ Token STOMP válido, mas perfil não encontrado");
                        }
                    } catch (IllegalArgumentException e) {
                        log.warn("[WS] ✗ Token JWT malformado ou expirado: {}", e.getMessage());
                    } catch (Exception e) {
                        log.error("[WS] ✗ Erro ao processar token JWT na autenticação WebSocket", e);
                    }
                }
                return message;
            }
        });
    }

    private HandshakeInterceptor authTokenHandshakeInterceptor() {
        return new HandshakeInterceptor() {
            @Override
            public boolean beforeHandshake(
                    @NonNull ServerHttpRequest request,
                    @NonNull ServerHttpResponse response,
                    @NonNull WebSocketHandler wsHandler,
                    @NonNull Map<String, Object> attributes
            ) {
                try {
                    String accessToken = UriComponentsBuilder.fromUri(request.getURI())
                            .build()
                            .getQueryParams()
                            .getFirst("access_token");

                    String token = StringUtils.hasText(accessToken)
                            ? accessToken
                            : UriComponentsBuilder.fromUri(request.getURI())
                                    .build()
                                    .getQueryParams()
                                    .getFirst("token");

                    if (token == null || token.isBlank()) {
                        return true;
                    }

                    String normalized = token.trim();
                    if (normalized.startsWith("Bearer ")) {
                        normalized = normalized.substring(7).trim();
                    }

                    Optional<Principal> principalOptional = authenticateToken(normalized);
                    if (principalOptional.isPresent()) {
                        attributes.put("wsPrincipal", principalOptional.get());
                    }
                } catch (Exception e) {
                    log.warn("[WS] Falha ao processar token no handshake: {}", e.getMessage());
                }
                return true;
            }

            @Override
            public void afterHandshake(
                    @NonNull ServerHttpRequest request,
                    @NonNull ServerHttpResponse response,
                    @NonNull WebSocketHandler wsHandler,
                    @Nullable Exception exception
            ) {
                // no-op
            }
        };
    }

    private Optional<Principal> authenticateToken(String token) {
        if (!StringUtils.hasText(token)) {
            return Optional.empty();
        }

        UUID authUserId = jwtService.extractUserId(token);
        log.debug("[WS] UserId extraído do token: {}", authUserId);

        Optional<UserProfile> profileOptional = userProfileRepository.findByAuthUserId(authUserId);
        if (profileOptional.isEmpty()) {
            return Optional.empty();
        }

        UserProfile profile = profileOptional.get();
        String profileId = profile.getId().toString();
        Principal principal = () -> profileId;
        return Optional.of(principal);
    }
}
