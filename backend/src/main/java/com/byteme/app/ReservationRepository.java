package com.byteme.app;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<Reservation, UUID> {
    List<Reservation> findByOrganisationOrgId(UUID orgId);
    @Query("SELECT r FROM Reservation r JOIN FETCH r.posting p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.window LEFT JOIN FETCH p.seller WHERE p.seller.sellerId = :sellerId")
    List<Reservation> findByPostingSellerSellerId(UUID sellerId);

    @Query("SELECT r FROM Reservation r JOIN FETCH r.posting p WHERE p.seller.sellerId = :sellerId AND r.status = :status")
    List<Reservation> findByPostingSellerSellerIdAndStatus(UUID sellerId, Reservation.Status status);
    List<Reservation> findByStatusAndPostingPickupEndAtBefore(Reservation.Status status, Instant cutoff);

    @Query("SELECT COUNT(DISTINCT r.posting.seller.sellerId) FROM Reservation r WHERE r.organisation.orgId = :orgId AND r.status = 'COLLECTED'")
    long countDistinctSellersByOrgId(UUID orgId);

    @Query("SELECT COUNT(DISTINCT r.posting.category.categoryId) FROM Reservation r WHERE r.organisation.orgId = :orgId AND r.status = 'COLLECTED' AND r.posting.category IS NOT NULL")
    long countDistinctCategoriesByOrgId(UUID orgId);
}
