package com.kanux.config;

import com.kanux.entity.ActivityLog;
import com.kanux.repository.ActivityLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Serviço assíncrono responsável por:
 * 1. Persistir logs de atividade na tabela activity_logs.
 * 2. Notificar admins quando status >= 400 via push notification e WebSocket.
 */
@Service
public class ActivityLogService {

    private static final Logger log = LoggerFactory.getLogger(ActivityLogService.class);

    private final ActivityLogRepository activityLogRepository;
    private final PushNotificationService pushNotificationService;

    public ActivityLogService(ActivityLogRepository activityLogRepository,
                               PushNotificationService pushNotificationService) {
        this.activityLogRepository = activityLogRepository;
        this.pushNotificationService = pushNotificationService;
    }

    @Async
    public void saveAsync(UUID companyId, UUID userProfileId, String userName,
                          String method, String endpoint, int status,
                          String actionType, String description,
                          String ipAddress, long durationMs) {
        try {
            ActivityLog entry = new ActivityLog();
            entry.setCompanyId(companyId);
            entry.setUserProfileId(userProfileId);
            entry.setUserName(userName);
            entry.setMethod(method);
            entry.setEndpoint(endpoint);
            entry.setStatus(status);
            entry.setActionType(actionType);
            entry.setDescription(description);
            entry.setIpAddress(ipAddress);
            entry.setDurationMs(durationMs);
            activityLogRepository.save(entry);

            // Notifica admins em tempo real quando ocorre erro HTTP >= 400
            if (status >= 400 && companyId != null) {
                pushNotificationService.notifyAdminsOnError(
                        companyId, userName, method, endpoint, status, description);
            }
        } catch (Exception e) {
            log.warn("Falha ao salvar activity log: {}", e.getMessage());
        }
    }
}

