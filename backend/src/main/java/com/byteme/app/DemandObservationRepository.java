package com.byteme.app;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DemandObservationRepository extends JpaRepository<DemandObservation, UUID> {

    List<DemandObservation> findBySellerSellerIdOrderByDateDesc(UUID sellerId);

    List<DemandObservation> findBySellerSellerIdAndCategoryCategoryIdAndWindowWindowId(
            UUID sellerId, UUID categoryId, UUID windowId);
}
