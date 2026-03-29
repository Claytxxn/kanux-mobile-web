package com.kanux.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "companies")
public class Company {
    @Id @GeneratedValue
    private UUID id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false, unique = true)
    private String slug;
    @Column(name = "company_number", insertable = false, updatable = false)
    private Integer companyNumber;
    @Column(name = "created_by")
    private UUID createdBy;
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public Company() {}

    public Company(UUID id, String name, String slug, Integer companyNumber, UUID createdBy, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.companyNumber = companyNumber;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public Integer getCompanyNumber() { return companyNumber; }
    public void setCompanyNumber(Integer companyNumber) { this.companyNumber = companyNumber; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    @PrePersist
    protected void onCreate() { if (createdAt == null) createdAt = Instant.now(); }
}
