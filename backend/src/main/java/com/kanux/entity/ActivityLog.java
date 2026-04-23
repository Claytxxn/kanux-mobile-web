package com.kanux.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "activity_logs")
public class ActivityLog {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "user_profile_id")
    private UUID userProfileId;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "method", length = 10)
    private String method;

    @Column(name = "endpoint")
    private String endpoint;

    @Column(name = "status")
    private Integer status;

    @Column(name = "action_type", length = 50)
    private String actionType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
