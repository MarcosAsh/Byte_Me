package com.byteme.app;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface IssueReportRepository extends JpaRepository<IssueReport, UUID> {

    List<IssueReport> findByOrganisationOrgId(UUID orgId);

    @Query("SELECT i FROM IssueReport i WHERE i.reservation.posting.seller.sellerId = :sellerId")
    List<IssueReport> findBySeller(UUID sellerId);

    @Query("SELECT i FROM IssueReport i WHERE i.reservation.posting.seller.sellerId = :sellerId AND i.status = 'OPEN'")
    List<IssueReport> findOpenBySeller(UUID sellerId);
}
