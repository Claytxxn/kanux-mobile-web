package com.kanux.repository;

import com.kanux.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {
    Optional<Company> findBySlug(String slug);

    List<Company> findAllByOrderByCompanyNumberAsc();

    @Query("SELECT c FROM Company c WHERE CAST(c.companyNumber AS string) = :num OR c.slug = :num")
    Optional<Company> findBySlugOrNumber(@Param("num") String num);

    @Query("SELECT c FROM Company c JOIN CompanyMember m ON m.companyId = c.id WHERE m.userProfileId = :profileId ORDER BY c.companyNumber ASC")
    List<Company> findByMemberProfileId(@Param("profileId") UUID profileId);
}
