package com.byteme.app;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * On startup, ensures there are active bundles with future pickup windows.
 * If all active bundles have expired, refreshes their dates so the browse
 * page always has something to show.
 */
@Component
public class BundleSeeder implements ApplicationRunner {

    private final BundlePostingRepository bundleRepo;

    public BundleSeeder(BundlePostingRepository bundleRepo) {
        this.bundleRepo = bundleRepo;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<BundlePosting> available = bundleRepo.findAvailable(Instant.now(),
                org.springframework.data.domain.Pageable.ofSize(1)).getContent();

        if (!available.isEmpty()) return; // bundles are fine

        // Refresh all ACTIVE bundles to have future pickup dates
        List<BundlePosting> active = bundleRepo.findAll().stream()
                .filter(b -> b.getStatus() == BundlePosting.Status.ACTIVE)
                .toList();

        Instant now = Instant.now();
        int dayOffset = 1;
        for (BundlePosting b : active) {
            b.setPickupStartAt(now.plus(dayOffset, ChronoUnit.DAYS));
            b.setPickupEndAt(now.plus(dayOffset, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS));
            b.setQuantityReserved(0);
            bundleRepo.save(b);
            dayOffset = (dayOffset % 7) + 1;
        }
    }
}
