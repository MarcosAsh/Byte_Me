package com.byteme.app;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface RescueEventRepository extends JpaRepository<RescueEvent, UUID> {

    List<RescueEvent> findByOrganisationOrgId(UUID orgId);

    @Query("SELECT COALESCE(SUM(r.mealsEstimate), 0) FROM RescueEvent r WHERE r.organisation.orgId = :orgId")
    long sumMealsByOrgId(UUID orgId);

    @Query("SELECT COALESCE(SUM(r.co2eEstimateGrams), 0) FROM RescueEvent r WHERE r.organisation.orgId = :orgId")
    long sumCo2eByOrgId(UUID orgId);
}
