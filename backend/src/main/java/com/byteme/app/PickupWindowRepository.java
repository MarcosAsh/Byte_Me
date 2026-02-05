package com.byteme.app;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface PickupWindowRepository extends JpaRepository<PickupWindow, UUID> {
    Optional<PickupWindow> findByLabel(String label);
}
