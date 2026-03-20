package com.byteme.app;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ForecastActionRepository extends JpaRepository<ForecastAction, UUID> {
    List<ForecastAction> findBySellerSellerIdOrderByCreatedAtDesc(UUID sellerId);
}
