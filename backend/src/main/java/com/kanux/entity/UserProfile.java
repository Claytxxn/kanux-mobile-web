package com.kanux.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
public class UserProfile {
    @Id @GeneratedValue
    private UUID id;
    @Column(name = "auth_user_id", nullable = false, unique = true)
    private UUID authUserId;
    @Column(name = "display_name")
    private String displayName;
    private String email;
    @Column(name = "avatar_url")
    private String avatarUrl;
    private String phone;
    private String position;
    private String department;
    @Column(name = "is_super_admin", nullable = false)
    private boolean isSuperAdmin = false;
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public UserProfile() {}

    public UserProfile(UUID id, UUID authUserId, String displayName, String email, String avatarUrl, String phone, String position, String department, boolean isSuperAdmin, Instant createdAt) {
        this.id = id;
        this.authUserId = authUserId;
        this.displayName = displayName;
        this.email = email;
        this.avatarUrl = avatarUrl;
        this.phone = phone;
        this.position = position;
        this.department = department;
        this.isSuperAdmin = isSuperAdmin;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getAuthUserId() { return authUserId; }
    public void setAuthUserId(UUID authUserId) { this.authUserId = authUserId; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public boolean isSuperAdmin() { return isSuperAdmin; }
    public void setSuperAdmin(boolean superAdmin) { isSuperAdmin = superAdmin; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    @PrePersist
    protected void onCreate() { if (createdAt == null) createdAt = Instant.now(); }
}
