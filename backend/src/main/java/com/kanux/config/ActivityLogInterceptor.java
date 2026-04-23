package com.kanux.config;

import com.kanux.entity.CompanyMember;
import com.kanux.entity.UserProfile;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Interceptor que registra toda requisição autenticada na tabela activity_logs.
 * Roda de forma assíncrona para não impactar a performance dos endpoints.
 */
@SuppressWarnings("unused")
@Component
public class ActivityLogInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(ActivityLogInterceptor.class);

    private static final String START_TIME_ATTR  = "reqStartTime";
    private static final String COMPANY_ID_ATTR  = "logCompanyId";
    private static final String USER_ID_ATTR     = "logUserId";
    private static final String USER_NAME_ATTR   = "logUserName";

    /** Extrai UUID de segmentos do path como /companies/{uuid}/... */
    private static final Pattern UUID_PATH_PATTERN =
            Pattern.compile("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

    private final CompanyMemberRepository companyMemberRepository;
    private final ActivityLogService activityLogService;

    public ActivityLogInterceptor(CompanyMemberRepository companyMemberRepository,
                                   ActivityLogService activityLogService) {
        this.companyMemberRepository = companyMemberRepository;
        this.activityLogService = activityLogService;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                              @NonNull Object handler) {
        request.setAttribute(START_TIME_ATTR, System.currentTimeMillis());

        // Captura usuário e companyId AQUI, enquanto o contexto está garantido
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserProfile profile) {
            request.setAttribute(USER_ID_ATTR,   profile.getId().toString());
            request.setAttribute(USER_NAME_ATTR, profile.getDisplayName() != null
                    ? profile.getDisplayName() : profile.getEmail());

            UUID companyId = resolveCompanyId(request, profile);
            if (companyId != null) {
                request.setAttribute(COMPANY_ID_ATTR, companyId.toString());
            }
        }
        return true;
    }

    @Override
    public void afterCompletion(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                                 @NonNull Object handler, @Nullable Exception ex) {
        String uri = request.getRequestURI();
        if (uri.startsWith("/api/health") || uri.startsWith("/api/debug") ||
                uri.startsWith("/actuator") || uri.equals("/api/verify-company") ||
                uri.startsWith("/api/auth")) {
            return;
        }

        // Usa dados pré-capturados no preHandle — sem depender do SecurityContext aqui
        String userIdStr   = (String) request.getAttribute(USER_ID_ATTR);
        String userName    = (String) request.getAttribute(USER_NAME_ATTR);
        String companyStr  = (String) request.getAttribute(COMPANY_ID_ATTR);

        if (userIdStr == null) return; // requisição não autenticada

        UUID userProfileId = UUID.fromString(userIdStr);
        UUID companyId     = companyStr != null ? UUID.fromString(companyStr) : null;

        Object startAttr  = request.getAttribute(START_TIME_ATTR);
        Long storedStart  = (startAttr instanceof Long) ? (Long) startAttr : null;
        long start        = storedStart != null ? storedStart : System.currentTimeMillis();
        long duration     = System.currentTimeMillis() - start;

        int    status = response.getStatus();
        String method = request.getMethod();
        String ip     = getClientIp(request);

        String actionType   = resolveActionType(method, uri, status);
        String description  = userName + " → " + method + " " + uri + " [" + status + "]"
                + (ex != null ? " | Erro: " + ex.getMessage() : "");

        activityLogService.saveAsync(
                companyId, userProfileId, userName,
                method, uri, status, actionType, description, ip, duration);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private UUID resolveCompanyId(HttpServletRequest request, UserProfile profile) {
        // 1. Parâmetro de query ?companyId=
        String param = request.getParameter("companyId");
        if (param != null && !param.isBlank()) {
            try { return UUID.fromString(param.trim()); } catch (IllegalArgumentException ignored) {}
        }

        // 2. Primeiro UUID do path que seja um companyId conhecido
        //    ex: /api/companies/{uuid}/members  ou  /api/admin/companies/{uuid}
        String path = request.getRequestURI();
        Matcher m = UUID_PATH_PATTERN.matcher(path);
        while (m.find()) {
            try {
                UUID candidate = UUID.fromString(m.group());
                // Verifica se o usuário é membro dessa empresa
                boolean isMember = companyMemberRepository
                        .findByUserProfileId(profile.getId()).stream()
                        .anyMatch(cm -> candidate.equals(cm.getCompanyId()));
                if (isMember) return candidate;
            } catch (Exception ignored) {}
        }

        // 3. Primeiro vínculo do usuário (fallback)
        try {
            List<CompanyMember> memberships = companyMemberRepository.findByUserProfileId(profile.getId());
            if (!memberships.isEmpty()) return memberships.get(0).getCompanyId();
        } catch (Exception ignored) {}

        return null;
    }

    private String resolveActionType(String method, String uri, int status) {
        if (status >= 400) return "ERROR";
        if (uri.contains("/auth/login"))    return "LOGIN";
        if (uri.contains("/profile"))       return "PROFILE";
        if (uri.contains("/messages"))      return "MESSAGE";
        if (uri.contains("/tickets"))       return "TICKET";
        if (uri.contains("/chats"))         return "CHAT";
        if (uri.contains("/members"))       return "MEMBER";
        if (uri.contains("/users"))         return "USER";
        if (uri.contains("/departments"))   return "DEPARTMENT";
        if (uri.contains("/companies"))     return "COMPANY";
        if (uri.contains("/admin"))         return "ADMIN";
        return switch (method) {
            case "POST"         -> "CREATE";
            case "PUT", "PATCH" -> "UPDATE";
            case "DELETE"       -> "DELETE";
            default             -> "READ";
        };
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank()) return ip.split(",")[0].trim();
        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isBlank()) return ip;
        return request.getRemoteAddr();
    }
}


