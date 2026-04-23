package com.kanux.config;

import com.kanux.entity.CompanyMember;
import com.kanux.entity.UserProfile;
import com.kanux.repository.ActivityLogRepository;
import com.kanux.repository.CompanyMemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.List;
import java.util.UUID;

/**
 * Interceptor que registra toda requisição autenticada na tabela activity_logs.
 * Roda de forma assíncrona para não impactar a performance dos endpoints.
 */
@SuppressWarnings("unused")
@Component
public class ActivityLogInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(ActivityLogInterceptor.class);

    /** Atributo usado para marcar o tempo de início da requisição. */
    private static final String START_TIME_ATTR = "reqStartTime";

    private final ActivityLogRepository activityLogRepository;
    private final CompanyMemberRepository companyMemberRepository;
    private final ActivityLogService activityLogService;

    public ActivityLogInterceptor(ActivityLogRepository activityLogRepository,
                                   CompanyMemberRepository companyMemberRepository,
                                   ActivityLogService activityLogService) {
        this.activityLogRepository = activityLogRepository;
        this.companyMemberRepository = companyMemberRepository;
        this.activityLogService = activityLogService;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                              @NonNull Object handler) {
        request.setAttribute(START_TIME_ATTR, System.currentTimeMillis());
        return true;
    }

    @Override
    public void afterCompletion(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                                 @NonNull Object handler, @Nullable Exception ex) {
        // Ignora health-check, debug e actuation endpoints
        String uri = request.getRequestURI();
        if (uri.startsWith("/api/health") || uri.startsWith("/api/debug") ||
                uri.startsWith("/actuator") || uri.equals("/api/verify-company") ||
                uri.startsWith("/api/auth")) {
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserProfile profile)) return;

        Object startAttr = request.getAttribute(START_TIME_ATTR);
        Long storedStart = (startAttr instanceof Long) ? (Long) startAttr : null;
        long start = storedStart != null ? storedStart : System.currentTimeMillis();
        long duration = System.currentTimeMillis() - start;
        int status = response.getStatus();
        String method = request.getMethod();
        String ip = getClientIp(request);

        // Descobre a empresa a partir do parâmetro ou do primeiro vínculo do usuário
        UUID companyId = extractCompanyId(request, profile);

        String actionType = resolveActionType(method, uri, status);
        String description = buildDescription(method, uri, status, profile, ex);

        activityLogService.saveAsync(
                companyId, profile.getId(), profile.getDisplayName(),
                method, uri, status, actionType, description, ip, duration);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private UUID extractCompanyId(HttpServletRequest request, UserProfile profile) {
        // 1. Parâmetro de query companyId
        String paramCompanyId = request.getParameter("companyId");
        if (paramCompanyId != null && !paramCompanyId.isBlank()) {
            try { return UUID.fromString(paramCompanyId); } catch (IllegalArgumentException ignored) {}
        }

        // 2. Primeiro vínculo do usuário (mais comum)
        try {
            List<CompanyMember> memberships = companyMemberRepository.findByUserProfileId(profile.getId());
            if (!memberships.isEmpty()) return memberships.get(0).getCompanyId();
        } catch (Exception ignored) {}

        return null;
    }

    private String resolveActionType(String method, String uri, int status) {
        if (status >= 400) return "ERROR";
        if (uri.contains("/auth/login"))         return "LOGIN";
        if (uri.contains("/profile"))            return "PROFILE";
        if (uri.contains("/messages"))           return "MESSAGE";
        if (uri.contains("/tickets"))            return "TICKET";
        if (uri.contains("/chats"))              return "CHAT";
        if (uri.contains("/members"))            return "MEMBER";
        if (uri.contains("/users"))              return "USER";
        if (uri.contains("/departments"))        return "DEPARTMENT";
        if (uri.contains("/companies"))          return "COMPANY";
        if (uri.contains("/admin"))              return "ADMIN";
        return switch (method) {
            case "POST"   -> "CREATE";
            case "PUT", "PATCH" -> "UPDATE";
            case "DELETE" -> "DELETE";
            default       -> "READ";
        };
    }

    private String buildDescription(String method, String uri, int status,
                                     UserProfile profile, Exception ex) {
        String name = profile.getDisplayName() != null ? profile.getDisplayName() : profile.getEmail();
        String base = name + " → " + method + " " + uri + " [" + status + "]";
        if (ex != null) base += " | Erro: " + ex.getMessage();
        return base;
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank()) return ip.split(",")[0].trim();
        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isBlank()) return ip;
        return request.getRemoteAddr();
    }
}
