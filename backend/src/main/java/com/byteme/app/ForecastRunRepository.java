package com.byteme.app;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ForecastRunRepository extends JpaRepository<ForecastRun, UUID> {

    List<ForecastRun> findAllByOrderByTrainedAtDesc();

    Optional<ForecastRun> findByModelName(String modelName);
}
