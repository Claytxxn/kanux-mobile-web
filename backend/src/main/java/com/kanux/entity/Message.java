package com.kanux.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
public class Message {
    @Id @GeneratedValue
    private UUID id;
    @Column(name = "chat_id", nullable = false)
    private UUID chatId;
    @Column(name = "user_profile_id", nullable = false)
    private UUID userProfileId;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String attachments = "[]";
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at")
    private Instant updatedAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_profile_id", insertable = false, updatable = false)
    private UserProfile userProfile;

    public Message() {}

    public Message(UUID id, UUID chatId, UUID userProfileId, String content, String attachments, Instant createdAt, Instant updatedAt, UserProfile userProfile) {
        this.id = id;
        this.chatId = chatId;
        this.userProfileId = userProfileId;
        this.content = content;
        this.attachments = attachments;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.userProfile = userProfile;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getChatId() { return chatId; }
    public void setChatId(UUID chatId) { this.chatId = chatId; }
    public UUID getUserProfileId() { return userProfileId; }
    public void setUserProfileId(UUID userProfileId) { this.userProfileId = userProfileId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getAttachments() { return attachments; }
    public void setAttachments(String attachments) { this.attachments = attachments; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public UserProfile getUserProfile() { return userProfile; }
    public void setUserProfile(UserProfile userProfile) { this.userProfile = userProfile; }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }
}
