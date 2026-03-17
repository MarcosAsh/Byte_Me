package com.byteme.app;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// Gamification controller
@RestController
@RequestMapping("/api/gamification")
public class GamificationController {

    // Repository dependencies
    private final OrganisationRepository orgRepo;
    private final OrganisationStreakCacheRepository streakRepo;
    private final ReservationRepository reservationRepo;
    private final BadgeRepository badgeRepo;
    private final OrganisationBadgeRepository orgBadgeRepo;
    private final RescueEventRepository rescueEventRepo;

    // Constructor injection
    public GamificationController(OrganisationRepository orgRepo, OrganisationStreakCacheRepository streakRepo,
                                   ReservationRepository reservationRepo, BadgeRepository badgeRepo,
                                   OrganisationBadgeRepository orgBadgeRepo, RescueEventRepository rescueEventRepo) {
        this.orgRepo = orgRepo;
        this.streakRepo = streakRepo;
        this.reservationRepo = reservationRepo;
        this.badgeRepo = badgeRepo;
        this.orgBadgeRepo = orgBadgeRepo;
        this.rescueEventRepo = rescueEventRepo;
    }

    // Check that the current user owns this org profile
    private ResponseEntity<?> checkOrgOwnership(Organisation org) {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!org.getUser().getUserId().equals(userId)) {
            return ResponseEntity.status(403).body("Access denied");
        }
        return null;
    }

    // Get org streak
    @GetMapping("/streak/{orgId}")
    public ResponseEntity<?> getStreak(@PathVariable UUID orgId) {
        var org = orgRepo.findById(orgId).orElse(null);
        if (org == null) return ResponseEntity.notFound().build();
        var denied = checkOrgOwnership(org);
        if (denied != null) return denied;

        var streak = streakRepo.findById(orgId).orElse(null);
        if (streak == null) {
            return ResponseEntity.ok(new StreakResponse(0, 0, null));
        }

        return ResponseEntity.ok(new StreakResponse(
                streak.getCurrentStreakWeeks(),
                streak.getBestStreakWeeks(),
                streak.getLastRescueWeekStart()
        ));
    }

    // Get org stats (also checks and awards any new badges)
    @GetMapping("/stats/{orgId}")
    @Transactional
    public ResponseEntity<?> getStats(@PathVariable UUID orgId) {
        var org = orgRepo.findById(orgId).orElse(null);
        if (org == null) return ResponseEntity.notFound().build();
        var denied = checkOrgOwnership(org);
        if (denied != null) return denied;

        // Check and award variety badges
        checkAndAwardBadges(orgId);

        // Calculate stats
        var streak = streakRepo.findById(orgId).orElse(null);
        int badgeCount = orgBadgeRepo.findByOrgId(orgId).size();
        int totalReservations = reservationRepo.findByOrganisationOrgId(orgId).size();

        int currentStreak = streak != null ? streak.getCurrentStreakWeeks() : 0;
        int bestStreak = streak != null ? streak.getBestStreakWeeks() : 0;

        long mealsRescued = rescueEventRepo.sumMealsByOrgId(orgId);
        long co2eSavedGrams = rescueEventRepo.sumCo2eByOrgId(orgId);

        return ResponseEntity.ok(new StatsResponse(
                totalReservations,
                currentStreak,
                bestStreak,
                badgeCount,
                mealsRescued,
                co2eSavedGrams
        ));
    }

    // Check variety conditions and award badges if earned
    private void checkAndAwardBadges(UUID orgId) {
        var existingBadges = orgBadgeRepo.findByOrgId(orgId);
        var earnedCodes = existingBadges.stream()
                .filter(ob -> ob.getBadge() != null)
                .map(ob -> ob.getBadge().getCode())
                .collect(java.util.stream.Collectors.toSet());

        // Variety badges: rescued from 3+ distinct sellers
        if (!earnedCodes.contains("VARIETY_SELLERS")) {
            long distinctSellers = reservationRepo.countDistinctSellersByOrgId(orgId);
            if (distinctSellers >= 3) {
                awardBadge(orgId, "VARIETY_SELLERS");
            }
        }

        // Variety badges: rescued from 3+ distinct categories
        if (!earnedCodes.contains("VARIETY_CATEGORIES")) {
            long distinctCategories = reservationRepo.countDistinctCategoriesByOrgId(orgId);
            if (distinctCategories >= 3) {
                awardBadge(orgId, "VARIETY_CATEGORIES");
            }
        }
    }

    // Award a badge by code
    private void awardBadge(UUID orgId, String badgeCode) {
        var badge = badgeRepo.findByCode(badgeCode).orElse(null);
        if (badge == null) return;

        OrganisationBadge ob = new OrganisationBadge();
        ob.setOrgId(orgId);
        ob.setBadgeId(badge.getBadgeId());
        orgBadgeRepo.save(ob);
    }

    // Get org badges
    @GetMapping("/badges/{orgId}")
    public ResponseEntity<?> getOrgBadges(@PathVariable UUID orgId) {
        var org = orgRepo.findById(orgId).orElse(null);
        if (org == null) return ResponseEntity.notFound().build();
        var denied = checkOrgOwnership(org);
        if (denied != null) return denied;
        return ResponseEntity.ok(orgBadgeRepo.findByOrgId(orgId));
    }

    // Get all badges
    @GetMapping("/badges")
    public List<Badge> getAllBadges() {
        return badgeRepo.findAll();
    }

    // Streak response data
    public static class StreakResponse {
        private int currentStreakWeeks;
        private int bestStreakWeeks;
        private LocalDate lastRescueWeekStart;

        public StreakResponse(int currentStreakWeeks, int bestStreakWeeks, LocalDate lastRescueWeekStart) {
            this.currentStreakWeeks = currentStreakWeeks;
            this.bestStreakWeeks = bestStreakWeeks;
            this.lastRescueWeekStart = lastRescueWeekStart;
        }

        public int getCurrentStreakWeeks() { return currentStreakWeeks; }
        public int getBestStreakWeeks() { return bestStreakWeeks; }
        public LocalDate getLastRescueWeekStart() { return lastRescueWeekStart; }
    }

    // Stats response data
    public static class StatsResponse {
        private int totalReservations;
        private int currentStreakWeeks;
        private int bestStreakWeeks;
        private int badgesEarned;
        private long mealsRescued;
        private long co2eSavedGrams;

        public StatsResponse(int totalReservations, int currentStreakWeeks, int bestStreakWeeks,
                              int badgesEarned, long mealsRescued, long co2eSavedGrams) {
            this.totalReservations = totalReservations;
            this.currentStreakWeeks = currentStreakWeeks;
            this.bestStreakWeeks = bestStreakWeeks;
            this.badgesEarned = badgesEarned;
            this.mealsRescued = mealsRescued;
            this.co2eSavedGrams = co2eSavedGrams;
        }

        public int getTotalReservations() { return totalReservations; }
        public int getCurrentStreakWeeks() { return currentStreakWeeks; }
        public int getBestStreakWeeks() { return bestStreakWeeks; }
        public int getBadgesEarned() { return badgesEarned; }
        public long getMealsRescued() { return mealsRescued; }
        public long getCo2eSavedGrams() { return co2eSavedGrams; }
    }
}
