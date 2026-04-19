package com.kanux.repository;

import com.kanux.entity.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface ChatRepository extends JpaRepository<Chat, UUID> {
    List<Chat> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    /** Retorna chats públicos da empresa + chats privados onde o usuário é membro. */
    @Query("""
            SELECT DISTINCT c FROM Chat c
            WHERE c.companyId = :companyId
              AND (
                    c.privateChat = false
                    OR EXISTS (
                        SELECT cm FROM ChatMember cm
                        WHERE cm.chatId = c.id
                          AND cm.userProfileId = :userProfileId
                    )
              )
            ORDER BY c.createdAt DESC
            """)
    List<Chat> findVisibleChats(@Param("companyId") UUID companyId,
                                @Param("userProfileId") UUID userProfileId);
}
