package com.byteme.app;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

// Order and reservation controller
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    // Repository dependencies
    private final ReservationRepository reservationRepo;
    private final BundlePostingRepository bundleRepo;
    private final OrganisationRepository orgRepo;
    private final OrganisationStreakCacheRepository streakRepo;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    // Constructor injection
    public OrderController(ReservationRepository reservationRepo, BundlePostingRepository bundleRepo,
                           OrganisationRepository orgRepo, OrganisationStreakCacheRepository streakRepo,
                           PasswordEncoder passwordEncoder) {
        this.reservationRepo = reservationRepo;
        this.bundleRepo = bundleRepo;
        this.orgRepo = orgRepo;
        this.streakRepo = streakRepo;
        this.passwordEncoder = passwordEncoder;
    }

    // Get orders by org
    @GetMapping("/org/{orgId}")
    public List<Reservation> getByOrg(@PathVariable UUID orgId) {
        return reservationRepo.findByOrganisationOrgId(orgId);
    }

    // Get orders by seller
    @GetMapping("/seller/{sellerId}")
    public List<Reservation> getBySeller(@PathVariable UUID sellerId) {
        return reservationRepo.findByPostingSellerSellerId(sellerId);
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

        // Update bundle quantity
        bundle.setQuantityReserved(bundle.getQuantityReserved() + 1);
        bundleRepo.save(bundle);

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
    public ResponseEntity<?> collect(@PathVariable UUID id, @RequestBody(required = false) ClaimRequest claimReq) {
        // Find reservation
        var reservation = reservationRepo.findById(id).orElse(null);
        if (reservation == null) return ResponseEntity.notFound().build();

        // Check status
        if (reservation.getStatus() != Reservation.Status.RESERVED) {
            return ResponseEntity.badRequest().body("Reservation not in RESERVED status");
        }

        // Verify claim code
        if (claimReq != null && claimReq.getClaimCode() != null) {
            if (!passwordEncoder.matches(claimReq.getClaimCode(), reservation.getClaimCodeHash())) {
                return ResponseEntity.badRequest().body("Invalid claim code");
            }
        }

        // Mark as collected
        reservation.setStatus(Reservation.Status.COLLECTED);
        reservation.setCollectedAt(Instant.now());
        reservationRepo.save(reservation);

        // Update org streak
        var org = reservation.getOrganisation();
        updateOrgStreak(org);

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

        // Release bundle quantity
        var bundle = reservation.getPosting();
        bundle.setQuantityReserved(bundle.getQuantityReserved() - 1);
        bundleRepo.save(bundle);

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
