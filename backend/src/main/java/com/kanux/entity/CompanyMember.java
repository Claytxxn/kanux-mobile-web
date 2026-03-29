package com.kanux.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "company_members")
public class CompanyMember {
    @Id @GeneratedValue
    private UUID id;
    @Column(name = "company_id", nullable = false)
    private UUID companyId;
    @Column(name = "user_profile_id", nullable = false)
    private UUID userProfileId;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberRole role = MemberRole.MEMBER;
    @Column(name = "joined_at", updatable = false)
    private Instant joinedAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_profile_id", insertable = false, updatable = false)
    private UserProfile userProfile;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    public CompanyMember() {}

    public CompanyMember(UUID id, UUID companyId, UUID userProfileId, MemberRole role, Instant joinedAt, UserProfile userProfile, Company company) {
        this.id = id;
        this.companyId = companyId;
        this.userProfileId = userProfileId;
        this.role = role;
        this.joinedAt = joinedAt;
        this.userProfile = userProfile;
        this.company = company;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getCompanyId() { return companyId; }
    public void setCompanyId(UUID companyId) { this.companyId = companyId; }
    public UUID getUserProfileId() { return userProfileId; }
    public void setUserProfileId(UUID userProfileId) { this.userProfileId = userProfileId; }
    public MemberRole getRole() { return role; }
    public void setRole(MemberRole role) { this.role = role; }
    public Instant getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Instant joinedAt) { this.joinedAt = joinedAt; }
    public UserProfile getUserProfile() { return userProfile; }
    public void setUserProfile(UserProfile userProfile) { this.userProfile = userProfile; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }

    @PrePersist
    protected void onCreate() { if (joinedAt == null) joinedAt = Instant.now(); }

    public enum MemberRole { MEMBER, MANAGER, ADMIN }
}
