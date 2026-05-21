package com.kanux.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kanux.entity.DepartmentMember;

public interface DepartmentMemberRepository extends JpaRepository<DepartmentMember, UUID> {

    @Query("SELECT dm FROM DepartmentMember dm LEFT JOIN FETCH dm.userProfile WHERE dm.departmentId = :departmentId")
    List<DepartmentMember> findByDepartmentIdWithProfile(@Param("departmentId") UUID departmentId);

    boolean existsByDepartmentIdAndUserProfileId(UUID departmentId, UUID userProfileId);

    void deleteByDepartmentIdAndUserProfileId(UUID departmentId, UUID userProfileId);
}
