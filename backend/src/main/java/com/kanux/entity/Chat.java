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
@Table(name = "chats")
public class Chat {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(nullable = false)
    private String name;

    /**
     * Lombok gera isPrivate() para o campo 'privateChat'.
     * Mapeado para a coluna is_private através da anotação @Column.
     */
    @Column(name = "is_private", nullable = false)
    private boolean privateChat = false;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
