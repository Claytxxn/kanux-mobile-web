package com.kanux.config;

import com.kanux.entity.ActivityLog;
import com.kanux.repository.ActivityLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Serviço assíncrono responsável por persistir os logs de atividade.
 * Usar um componente separado evita problemas de proxy com @Async na mesma classe.
 */
@Service
public class ActivityLogService {

    private static final Logger log = LoggerFactory.getLogger(ActivityLogService.class);

    private final ActivityLogRepository activityLogRepository;

    public ActivityLogService(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
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
        } catch (Exception e) {
            log.warn("Falha ao salvar activity log: {}", e.getMessage());
        }
    }
}
