package com.byteme.app;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

// Order and reservation controller
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    // Repository dependencies
    private final ReservationRepository reservationRepo;
    private final BundlePostingRepository bundleRepo;
    private final OrganisationRepository orgRepo;
    private final OrganisationStreakCacheRepository streakRepo;
    private final SellerRepository sellerRepo;
    private final BadgeRepository badgeRepo;
    private final OrganisationBadgeRepository orgBadgeRepo;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    // Constructor injection
    public OrderController(ReservationRepository reservationRepo, BundlePostingRepository bundleRepo,
                           OrganisationRepository orgRepo, OrganisationStreakCacheRepository streakRepo,
                           SellerRepository sellerRepo, BadgeRepository badgeRepo,
                           OrganisationBadgeRepository orgBadgeRepo, PasswordEncoder passwordEncoder) {
        this.reservationRepo = reservationRepo;
        this.bundleRepo = bundleRepo;
        this.orgRepo = orgRepo;
        this.streakRepo = streakRepo;
        this.sellerRepo = sellerRepo;
        this.badgeRepo = badgeRepo;
        this.orgBadgeRepo = orgBadgeRepo;
        this.passwordEncoder = passwordEncoder;
    }

    // Get orders by org
    @GetMapping("/org/{orgId}")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> getByOrg(@PathVariable UUID orgId) {
        UUID userId = (UUID) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        var org = orgRepo.findById(orgId).orElse(null);
        if (org == null) return ResponseEntity.notFound().build();
        if (!org.getUser().getUserId().equals(userId)) {
            return ResponseEntity.status(403).body("Access denied");
        }
        return ResponseEntity.ok(reservationRepo.findByOrganisationOrgId(orgId).stream().map(r -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("reservationId", r.getReservationId());
            map.put("postingTitle", r.getPosting().getTitle());
            map.put("sellerName", r.getPosting().getSeller().getName());
            map.put("sellerLocation", r.getPosting().getSeller().getLocationText());
            map.put("priceCents", r.getPosting().getPriceCents());
            map.put("pickupStartAt", r.getPosting().getPickupStartAt().toString());
            map.put("pickupEndAt", r.getPosting().getPickupEndAt().toString());
            map.put("status", r.getStatus().name());
            map.put("reservedAt", r.getReservedAt().toString());
            map.put("claimCodeLast4", r.getClaimCodeLast4());
            if (r.getCollectedAt() != null) map.put("collectedAt", r.getCollectedAt().toString());
            if (r.getCancelledAt() != null) map.put("cancelledAt", r.getCancelledAt().toString());
            return map;
        }).collect(Collectors.toList()));
    }

    // Get orders by seller (returns DTOs with posting title and org name)
    @GetMapping("/seller/{sellerId}")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> getBySeller(@PathVariable UUID sellerId) {
        UUID userId = (UUID) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();
        if (!seller.getUser().getUserId().equals(userId)) {
            return ResponseEntity.status(403).body("Access denied");
        }
        return ResponseEntity.ok(reservationRepo.findByPostingSellerSellerId(sellerId).stream().map(r -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("reservationId", r.getReservationId());
            map.put("postingTitle", r.getPosting().getTitle());
            map.put("organisationName", r.getOrganisation().getName());
            map.put("status", r.getStatus().name());
            map.put("reservedAt", r.getReservedAt().toString());
            if (r.getCollectedAt() != null) map.put("collectedAt", r.getCollectedAt().toString());
            if (r.getCancelledAt() != null) map.put("cancelledAt", r.getCancelledAt().toString());
            return map;
        }).collect(Collectors.toList()));
    }

    // Create new order
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateOrderRequest req) {
        // Find bundle
        var bundle = bundleRepo.findById(req.getPostingId()).orElse(null);
        if (bundle == null) return ResponseEntity.notFound().build();

        // Check availability
        if (!bundle.canReserve(1)) {
            return ResponseEntity.badRequest().body("No bundles available");
        }

        // Find organisation
        var org = orgRepo.findById(req.getOrgId()).orElse(null);
        if (org == null) return ResponseEntity.badRequest().body("Organisation not found");

        // Generate claim code
        String claimCode = String.format("%06d", random.nextInt(1000000));
        String claimCodeHash = passwordEncoder.encode(claimCode);
        String claimCodeLast4 = claimCode.substring(claimCode.length() - 4);

        // Create reservation
        Reservation reservation = new Reservation();
        reservation.setOrganisation(org);
        reservation.setPosting(bundle);
        reservation.setClaimCodeHash(claimCodeHash);
        reservation.setClaimCodeLast4(claimCodeLast4);

        // Trigger handles quantity_reserved increment
        var saved = reservationRepo.save(reservation);

        // Return order response
        return ResponseEntity.ok(new OrderResponse(
                saved.getReservationId(),
                1,
                bundle.getPriceCents(),
                bundle.getPickupStartAt(),
                bundle.getPickupEndAt(),
                bundle.getSeller().getName(),
                bundle.getSeller().getLocationText(),
                claimCode
        ));
    }

    // Collect order
    @PostMapping("/{id}/collect")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> collect(@PathVariable UUID id, @RequestBody ClaimRequest claimReq) {
        // Find reservation
        var reservation = reservationRepo.findById(id).orElse(null);
        if (reservation == null) return ResponseEntity.notFound().build();

        // Check status
        if (reservation.getStatus() != Reservation.Status.RESERVED) {
            return ResponseEntity.badRequest().body("Reservation not in RESERVED status");
        }

        // Verify claim code (required)
        if (claimReq == null || claimReq.getClaimCode() == null || claimReq.getClaimCode().isBlank()) {
            return ResponseEntity.badRequest().body("Claim code is required");
        }
        if (!passwordEncoder.matches(claimReq.getClaimCode(), reservation.getClaimCodeHash())) {
            return ResponseEntity.badRequest().body("Invalid claim code");
        }

        // Mark as collected
        reservation.setStatus(Reservation.Status.COLLECTED);
        reservation.setCollectedAt(Instant.now());
        reservationRepo.save(reservation);

        // Update org streak and check badge awards
        var org = reservation.getOrganisation();
        updateOrgStreak(org);
        checkBadgeAwards(org);

        return ResponseEntity.ok(new CollectResponse(true, "Reservation collected successfully"));
    }

    // Cancel order
    @PostMapping("/{id}/cancel")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> cancel(@PathVariable UUID id) {
        // Find reservation
        var reservation = reservationRepo.findById(id).orElse(null);
        if (reservation == null) return ResponseEntity.notFound().build();

        // Check status
        if (reservation.getStatus() != Reservation.Status.RESERVED) {
            return ResponseEntity.badRequest().body("Can only cancel RESERVED reservations");
        }

        // Mark as cancelled
        reservation.setStatus(Reservation.Status.CANCELLED);
        reservation.setCancelledAt(Instant.now());

        // Trigger handles quantity_reserved decrement
        return ResponseEntity.ok(reservationRepo.save(reservation));
    }

    // Update organisation streak
    private void updateOrgStreak(Organisation org) {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(WeekFields.of(Locale.getDefault()).dayOfWeek(), 1);

        var streakOpt = streakRepo.findById(org.getOrgId());
        OrganisationStreakCache streak;

        // Create or update streak
        if (streakOpt.isEmpty()) {
            streak = new OrganisationStreakCache();
            streak.setOrganisation(org);
            streak.setCurrentStreakWeeks(1);
            streak.setLastRescueWeekStart(weekStart);
        } else {
            streak = streakOpt.get();
            if (streak.getLastRescueWeekStart() == null) {
                streak.setCurrentStreakWeeks(1);
            } else if (streak.getLastRescueWeekStart().equals(weekStart)) {
                // Same week no change
            } else if (streak.getLastRescueWeekStart().plusWeeks(1).equals(weekStart)) {
                streak.setCurrentStreakWeeks(streak.getCurrentStreakWeeks() + 1);
            } else {
                streak.setCurrentStreakWeeks(1);
            }
            streak.setLastRescueWeekStart(weekStart);
        }

        // Update best streak
        if (streak.getCurrentStreakWeeks() > streak.getBestStreakWeeks()) {
            streak.setBestStreakWeeks(streak.getCurrentStreakWeeks());
        }

        streak.setUpdatedAt(Instant.now());
        streakRepo.save(streak);
    }

    // Award badges based on collection milestones
    private void checkBadgeAwards(Organisation org) {
        UUID orgId = org.getOrgId();
        var existingBadges = orgBadgeRepo.findByOrgId(orgId);
        var existingCodes = existingBadges.stream()
                .map(ob -> ob.getBadge().getCode())
                .collect(Collectors.toSet());

        // FIRST_RESCUE: first ever collection
        long collectedCount = reservationRepo.findByOrganisationOrgId(orgId).stream()
                .filter(r -> r.getStatus() == Reservation.Status.COLLECTED)
                .count();

        if (collectedCount >= 1 && !existingCodes.contains("FIRST_RESCUE")) {
            awardBadge(orgId, "FIRST_RESCUE");
        }

        // STREAK_4: 4-week consecutive streak
        var streak = streakRepo.findById(orgId).orElse(null);
        if (streak != null && streak.getCurrentStreakWeeks() >= 4 && !existingCodes.contains("STREAK_4")) {
            awardBadge(orgId, "STREAK_4");
        }

        // CO2_SAVER: 10+ collections
        if (collectedCount >= 10 && !existingCodes.contains("CO2_SAVER")) {
            awardBadge(orgId, "CO2_SAVER");
        }
    }

    // Award a badge by code to an org
    private void awardBadge(UUID orgId, String badgeCode) {
        var badge = badgeRepo.findByCode(badgeCode).orElse(null);
        if (badge == null) return;

        OrganisationBadge ob = new OrganisationBadge();
        ob.setOrgId(orgId);
        ob.setBadgeId(badge.getBadgeId());
        ob.setAwardedAt(Instant.now());
        orgBadgeRepo.save(ob);
    }

    // Create order request data
    public static class CreateOrderRequest {
        private UUID postingId;
        private UUID orgId;

        public UUID getPostingId() { return postingId; }
        public void setPostingId(UUID postingId) { this.postingId = postingId; }
        public UUID getOrgId() { return orgId; }
        public void setOrgId(UUID orgId) { this.orgId = orgId; }
    }

    // Claim code request data
    public static class ClaimRequest {
        private String claimCode;
        public String getClaimCode() { return claimCode; }
        public void setClaimCode(String claimCode) { this.claimCode = claimCode; }
    }

    // Order response data
    public static class OrderResponse {
        private UUID reservationId;
        private Integer quantity;
        private Integer priceCents;
        private Instant pickupStartAt;
        private Instant pickupEndAt;
        private String sellerName;
        private String sellerLocation;
        private String claimCode;

        public OrderResponse(UUID reservationId, Integer quantity, Integer priceCents,
                             Instant pickupStartAt, Instant pickupEndAt, String sellerName,
                             String sellerLocation, String claimCode) {
            this.reservationId = reservationId;
            this.quantity = quantity;
            this.priceCents = priceCents;
            this.pickupStartAt = pickupStartAt;
            this.pickupEndAt = pickupEndAt;
            this.sellerName = sellerName;
            this.sellerLocation = sellerLocation;
            this.claimCode = claimCode;
        }

        public UUID getReservationId() { return reservationId; }
        public Integer getQuantity() { return quantity; }
        public Integer getPriceCents() { return priceCents; }
        public Instant getPickupStartAt() { return pickupStartAt; }
        public Instant getPickupEndAt() { return pickupEndAt; }
        public String getSellerName() { return sellerName; }
        public String getSellerLocation() { return sellerLocation; }
        public String getClaimCode() { return claimCode; }
    }

    // Collect response data
    public static class CollectResponse {
        private boolean success;
        private String message;

        public CollectResponse(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }
}
