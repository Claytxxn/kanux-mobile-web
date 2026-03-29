package com.kanux.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "departments")
public class Department {
    @Id @GeneratedValue
    private UUID id;
    @Column(name = "company_id", nullable = false)
    private UUID companyId;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private String slug;
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public Department() {}

    public Department(UUID id, UUID companyId, String name, String slug, Instant createdAt) {
        this.id = id;
        this.companyId = companyId;
        this.name = name;
        this.slug = slug;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getCompanyId() { return companyId; }
    public void setCompanyId(UUID companyId) { this.companyId = companyId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    @PrePersist
    protected void onCreate() { if (createdAt == null) createdAt = Instant.now(); }
}
