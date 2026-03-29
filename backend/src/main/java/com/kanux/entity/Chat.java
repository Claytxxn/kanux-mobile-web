package com.kanux.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chats")
public class Chat {
    @Id @GeneratedValue
    private UUID id;
    @Column(name = "company_id", nullable = false)
    private UUID companyId;
    @Column(name = "department_id")
    private UUID departmentId;
    @Column(nullable = false)
    private String name;
    @Column(name = "is_private", nullable = false)
    private boolean isPrivate = false;
    @Column(name = "created_by")
    private UUID createdBy;
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public Chat() {}

    public Chat(UUID id, UUID companyId, UUID departmentId, String name, boolean isPrivate, UUID createdBy, Instant createdAt) {
        this.id = id;
        this.companyId = companyId;
        this.departmentId = departmentId;
        this.name = name;
        this.isPrivate = isPrivate;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getCompanyId() { return companyId; }
    public void setCompanyId(UUID companyId) { this.companyId = companyId; }
    public UUID getDepartmentId() { return departmentId; }
    public void setDepartmentId(UUID departmentId) { this.departmentId = departmentId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public boolean isPrivate() { return isPrivate; }
    public void setPrivate(boolean aPrivate) { isPrivate = aPrivate; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    @PrePersist
    protected void onCreate() { if (createdAt == null) createdAt = Instant.now(); }
}
