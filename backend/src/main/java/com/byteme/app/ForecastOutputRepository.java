package com.byteme.app;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface ForecastOutputRepository extends JpaRepository<ForecastOutput, UUID> {

    List<ForecastOutput> findByPostingPostingId(UUID postingId);

    List<ForecastOutput> findByRunRunId(UUID runId);

    @Query("SELECT fo FROM ForecastOutput fo WHERE fo.posting.seller.sellerId = :sellerId")
    List<ForecastOutput> findBySellerId(UUID sellerId);
}
