package com.kanux.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidade que representa o vínculo de um usuário com uma empresa.
 * Armazena a função (role) e as permissões de tela do membro.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "company_members")
public class CompanyMember {

    /** Identificador único do vínculo */
    @Id
    @GeneratedValue
    private UUID id;

    /** ID da empresa vinculada */
    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    /** ID do perfil de usuário vinculado */
    @Column(name = "user_profile_id", nullable = false)
    private UUID userProfileId;

    /** Função do membro na empresa (padrão: MEMBER) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberRole role = MemberRole.MEMBER;

    /** Permissões de acesso por tela em formato JSON (ex.: {"tickets":"VIEW"}) */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "screen_permissions", columnDefinition = "jsonb")
    private String screenPermissions = "{}";

    /** Data/hora em que o membro entrou na empresa */
    @Column(name = "joined_at", updatable = false)
    private Instant joinedAt;

    /** Perfil de usuário associado (lazy) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_profile_id", insertable = false, updatable = false)
    private UserProfile userProfile;

    /** Empresa associada (lazy) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    /** Inicializa joinedAt automaticamente na persistência */
    @PrePersist
    protected void onCreate() {
        if (joinedAt == null) joinedAt = Instant.now();
    }

    /** Níveis de acesso possíveis de um membro */
    public enum MemberRole { MEMBER, MANAGER, ADMIN, SUPER_ADMIN }
}
