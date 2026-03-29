package com.kanux.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ticket_comments")
public class TicketComment {
    @Id @GeneratedValue
    private UUID id;
    @Column(name = "ticket_id", nullable = false)
    private UUID ticketId;
    @Column(name = "user_profile_id", nullable = false)
    private UUID userProfileId;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_profile_id", insertable = false, updatable = false)
    private UserProfile userProfile;

    public TicketComment() {}

    public TicketComment(UUID id, UUID ticketId, UUID userProfileId, String content, Instant createdAt, UserProfile userProfile) {
        this.id = id;
        this.ticketId = ticketId;
        this.userProfileId = userProfileId;
        this.content = content;
        this.createdAt = createdAt;
        this.userProfile = userProfile;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getTicketId() { return ticketId; }
    public void setTicketId(UUID ticketId) { this.ticketId = ticketId; }
    public UUID getUserProfileId() { return userProfileId; }
    public void setUserProfileId(UUID userProfileId) { this.userProfileId = userProfileId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public UserProfile getUserProfile() { return userProfile; }
    public void setUserProfile(UserProfile userProfile) { this.userProfile = userProfile; }

    @PrePersist
    protected void onCreate() { if (createdAt == null) createdAt = Instant.now(); }
}
