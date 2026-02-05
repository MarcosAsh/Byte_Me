package com.byteme.app;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<Reservation, UUID> {
    List<Reservation> findByOrganisationOrgId(UUID orgId);
    List<Reservation> findByPostingSellerSellerId(UUID sellerId);
    List<Reservation> findByPostingSellerSellerIdAndStatus(UUID sellerId, Reservation.Status status);
}
