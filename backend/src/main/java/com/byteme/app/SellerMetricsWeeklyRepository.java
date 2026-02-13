package com.byteme.app;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SellerMetricsWeeklyRepository extends JpaRepository<SellerMetricsWeekly, SellerMetricsWeeklyId> {

    List<SellerMetricsWeekly> findBySellerIdOrderByWeekStartDesc(UUID sellerId);
}
