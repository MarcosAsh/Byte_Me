package com.byteme.app;

import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class OrganisationStreakCacheTest {

    @Test
    void testStreakCacheStateAndGetters() {
        OrganisationStreakCache cache = new OrganisationStreakCache();
        Organisation org = new Organisation();
        LocalDate weekStart = LocalDate.of(2026, 2, 1);
        Instant now = Instant.now();

        cache.setOrganisation(org);
        cache.setCurrentStreakWeeks(5);
        cache.setBestStreakWeeks(10);
        cache.setLastRescueWeekStart(weekStart);
        cache.setUpdatedAt(now);

        assertEquals(org, cache.getOrganisation());
        assertEquals(5, cache.getCurrentStreakWeeks());
        assertEquals(10, cache.getBestStreakWeeks());
        assertEquals(weekStart, cache.getLastRescueWeekStart());
        assertEquals(now, cache.getUpdatedAt());
    }

    @Test
    void testDefaults() {
        OrganisationStreakCache cache = new OrganisationStreakCache();

        assertEquals(0, cache.getCurrentStreakWeeks(), "Current streak should default to 0");
        assertEquals(0, cache.getBestStreakWeeks(), "Best streak should default to 0");
        assertNotNull(cache.getUpdatedAt(), "UpdatedAt should be auto-initialized");
    }

    @Test
    void testStreakUpdates() {
        OrganisationStreakCache cache = new OrganisationStreakCache();

        cache.setCurrentStreakWeeks(cache.getCurrentStreakWeeks() + 1);
        if (cache.getCurrentStreakWeeks() > cache.getBestStreakWeeks()) {
            cache.setBestStreakWeeks(cache.getCurrentStreakWeeks());
        }

        assertEquals(1, cache.getCurrentStreakWeeks());
        assertEquals(1, cache.getBestStreakWeeks());
    }
}
