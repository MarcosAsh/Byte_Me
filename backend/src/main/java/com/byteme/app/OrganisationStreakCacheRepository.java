package com.byteme.app;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface OrganisationStreakCacheRepository extends JpaRepository<OrganisationStreakCache, UUID> {
}
