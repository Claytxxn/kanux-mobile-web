package com.kanux.repository;

import com.kanux.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    Optional<UserProfile> findByAuthUserId(UUID authUserId);
    Optional<UserProfile> findByEmail(String email);
}
