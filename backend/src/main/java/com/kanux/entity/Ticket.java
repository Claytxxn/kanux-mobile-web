package com.kanux.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tickets")
public class Ticket {
    @Id @GeneratedValue
    private UUID id;
    @Column(insertable = false, updatable = false)
    private String number;
    @Column(name = "company_id", nullable = false)
    private UUID companyId;
    @Column(name = "department_id")
    private UUID departmentId;
    @Column(name = "creator_profile_id", nullable = false)
    private UUID creatorProfileId;
    @Column(name = "assignee_profile_id")
    private UUID assigneeProfileId;
    @Column(nullable = false)
    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status = TicketStatus.OPEN;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketPriority priority = TicketPriority.MEDIUM;
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at")
    private Instant updatedAt;
    @Column(name = "resolved_at")
    private Instant resolvedAt;

    public Ticket() {}

    public Ticket(UUID id, String number, UUID companyId, UUID departmentId, UUID creatorProfileId, UUID assigneeProfileId, String title, String description, TicketStatus status, TicketPriority priority, Instant createdAt, Instant updatedAt, Instant resolvedAt) {
        this.id = id;
        this.number = number;
        this.companyId = companyId;
        this.departmentId = departmentId;
        this.creatorProfileId = creatorProfileId;
        this.assigneeProfileId = assigneeProfileId;
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.resolvedAt = resolvedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getNumber() { return number; }
    public void setNumber(String number) { this.number = number; }
    public UUID getCompanyId() { return companyId; }
    public void setCompanyId(UUID companyId) { this.companyId = companyId; }
    public UUID getDepartmentId() { return departmentId; }
    public void setDepartmentId(UUID departmentId) { this.departmentId = departmentId; }
    public UUID getCreatorProfileId() { return creatorProfileId; }
    public void setCreatorProfileId(UUID creatorProfileId) { this.creatorProfileId = creatorProfileId; }
    public UUID getAssigneeProfileId() { return assigneeProfileId; }
    public void setAssigneeProfileId(UUID assigneeProfileId) { this.assigneeProfileId = assigneeProfileId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public TicketStatus getStatus() { return status; }
    public void setStatus(TicketStatus status) { this.status = status; }
    public TicketPriority getPriority() { return priority; }
    public void setPriority(TicketPriority priority) { this.priority = priority; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }

    public enum TicketStatus { OPEN, PENDING, RESOLVED, CLOSED }
    public enum TicketPriority { LOW, MEDIUM, HIGH }
}
