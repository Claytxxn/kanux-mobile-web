package com.kanux.repository;

import com.kanux.entity.ActivityLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {

    List<ActivityLog> findByCompanyIdOrderByCreatedAtDesc(UUID companyId, Pageable pageable);

    List<ActivityLog> findByCompanyIdAndStatusGreaterThanEqualOrderByCreatedAtDesc(
            UUID companyId, int status, Pageable pageable);

    @Query("SELECT a FROM ActivityLog a WHERE a.companyId = :companyId AND a.status >= 400 " +
           "ORDER BY a.createdAt DESC")
    List<ActivityLog> findErrorsByCompanyId(@Param("companyId") UUID companyId, Pageable pageable);

    long countByCompanyIdAndStatus(UUID companyId, int status);

    long countByCompanyIdAndStatusGreaterThanEqual(UUID companyId, int status);
}
