package com.byteme.app;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

// Analytics controller
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    // Repository dependencies
    private final BundlePostingRepository bundleRepo;
    private final ReservationRepository reservationRepo;
    private final IssueReportRepository issueRepo;
    private final SellerRepository sellerRepo;

    // Constructor injection
    public AnalyticsController(BundlePostingRepository bundleRepo, ReservationRepository reservationRepo,
                                IssueReportRepository issueRepo, SellerRepository sellerRepo) {
        this.bundleRepo = bundleRepo;
        this.reservationRepo = reservationRepo;
        this.issueRepo = issueRepo;
        this.sellerRepo = sellerRepo;
    }

    // Get seller dashboard
    @GetMapping("/dashboard/{sellerId}")
    public ResponseEntity<?> getDashboard(@PathVariable UUID sellerId) {
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();

        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!seller.getUser().getUserId().equals(userId)) {
            return ResponseEntity.status(403).body("Access denied");
        }

        // Get bundles and reservations
        var bundles = bundleRepo.findBySeller_SellerId(sellerId);
        var reservations = reservationRepo.findByPostingSellerSellerId(sellerId);

        // Calculate metrics
        int totalPosted = bundles.size();
        int totalQuantity = bundles.stream().mapToInt(BundlePosting::getQuantityTotal).sum();

        long collectedCount = reservations.stream().filter(r -> r.getStatus() == Reservation.Status.COLLECTED).count();
        long cancelledCount = reservations.stream().filter(r -> r.getStatus() == Reservation.Status.CANCELLED).count();
        long expiredCount = reservations.stream().filter(r -> r.getStatus() == Reservation.Status.EXPIRED).count();

        double sellThrough = totalQuantity > 0 ? (double) collectedCount / totalQuantity * 100 : 0;
        int openIssues = issueRepo.findOpenBySeller(sellerId).size();

        return ResponseEntity.ok(new DashboardResponse(
                seller.getName(), totalPosted, totalQuantity, (int) collectedCount,
                (int) cancelledCount, (int) expiredCount, Math.round(sellThrough * 10) / 10.0, openIssues
        ));
    }

    // Get sell through rate
    @GetMapping("/sell-through/{sellerId}")
    public ResponseEntity<?> getSellThrough(@PathVariable UUID sellerId) {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();
        if (!seller.getUser().getUserId().equals(userId)) {
            return ResponseEntity.status(403).body("Access denied");
        }

        var reservations = reservationRepo.findByPostingSellerSellerId(sellerId);

        // Calculate rates
        long collected = reservations.stream().filter(r -> r.getStatus() == Reservation.Status.COLLECTED).count();
        long cancelled = reservations.stream().filter(r -> r.getStatus() == Reservation.Status.CANCELLED).count();
        long expired = reservations.stream().filter(r -> r.getStatus() == Reservation.Status.EXPIRED).count();

        long total = collected + cancelled + expired;

        return ResponseEntity.ok(new SellThroughResponse(
                (int) collected, (int) cancelled, (int) expired,
                total > 0 ? (double) collected / total * 100 : 0,
                total > 0 ? (double) cancelled / total * 100 : 0
        ));
    }

    // Dashboard response data
    public static class DashboardResponse {
        private String sellerName;
        private int totalBundlesPosted;
        private int totalQuantity;
        private int collectedCount;
        private int cancelledCount;
        private int expiredCount;
        private double sellThroughRate;
        private int openIssueCount;

        public DashboardResponse(String sellerName, int totalBundlesPosted, int totalQuantity,
                                  int collectedCount, int cancelledCount, int expiredCount,
                                  double sellThroughRate, int openIssueCount) {
            this.sellerName = sellerName;
            this.totalBundlesPosted = totalBundlesPosted;
            this.totalQuantity = totalQuantity;
            this.collectedCount = collectedCount;
            this.cancelledCount = cancelledCount;
            this.expiredCount = expiredCount;
            this.sellThroughRate = sellThroughRate;
            this.openIssueCount = openIssueCount;
        }

        public String getSellerName() { return sellerName; }
        public int getTotalBundlesPosted() { return totalBundlesPosted; }
        public int getTotalQuantity() { return totalQuantity; }
        public int getCollectedCount() { return collectedCount; }
        public int getCancelledCount() { return cancelledCount; }
        public int getExpiredCount() { return expiredCount; }
        public double getSellThroughRate() { return sellThroughRate; }
        public int getOpenIssueCount() { return openIssueCount; }
    }

    // Sell through response data
    public static class SellThroughResponse {
        private int collected;
        private int cancelled;
        private int expired;
        private double collectionRate;
        private double cancelRate;

        public SellThroughResponse(int collected, int cancelled, int expired, double collectionRate, double cancelRate) {
            this.collected = collected;
            this.cancelled = cancelled;
            this.expired = expired;
            this.collectionRate = collectionRate;
            this.cancelRate = cancelRate;
        }

        public int getCollected() { return collected; }
        public int getCancelled() { return cancelled; }
        public int getExpired() { return expired; }
        public double getCollectionRate() { return collectionRate; }
        public double getCancelRate() { return cancelRate; }
    }

    // Pricing effectiveness endpoint
    @GetMapping("/pricing/{sellerId}")
    public ResponseEntity<?> getPricingEffectiveness(@PathVariable UUID sellerId) {
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();

        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!seller.getUser().getUserId().equals(userId)) {
            return ResponseEntity.status(403).body("Access denied");
        }

        var bundles = bundleRepo.findBySeller_SellerId(sellerId);
        var reservations = reservationRepo.findByPostingSellerSellerId(sellerId);

        // Map postingId -> list of reservations for quick lookup
        Map<UUID, List<Reservation>> resByPosting = reservations.stream()
                .collect(Collectors.groupingBy(r -> r.getPosting().getPostingId()));

        // Define brackets
        String[] bracketLabels = {"0%", "1-20%", "21-40%", "41-60%", "61-100%"};
        int[][] bracketRanges = {{0, 0}, {1, 20}, {21, 40}, {41, 60}, {61, 100}};

        List<PricingRow> rows = new ArrayList<>();
        for (int i = 0; i < bracketLabels.length; i++) {
            int lo = bracketRanges[i][0];
            int hi = bracketRanges[i][1];

            List<BundlePosting> matched = bundles.stream()
                    .filter(b -> b.getDiscountPct() >= lo && b.getDiscountPct() <= hi)
                    .toList();

            int bundleCount = matched.size();
            int totalQty = matched.stream().mapToInt(BundlePosting::getQuantityTotal).sum();
            long collected = matched.stream()
                    .flatMap(b -> resByPosting.getOrDefault(b.getPostingId(), List.of()).stream())
                    .filter(r -> r.getStatus() == Reservation.Status.COLLECTED)
                    .count();
            double sellThrough = totalQty > 0 ? (double) collected / totalQty * 100 : 0;

            rows.add(new PricingRow(bracketLabels[i], bundleCount, totalQty, (int) collected,
                    Math.round(sellThrough * 10) / 10.0));
        }

        return ResponseEntity.ok(rows);
    }

    // Popular pickup windows endpoint
    @GetMapping("/popular-windows/{sellerId}")
    public ResponseEntity<?> getPopularWindows(@PathVariable UUID sellerId) {
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();

        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!seller.getUser().getUserId().equals(userId)) {
            return ResponseEntity.status(403).body("Access denied");
        }

        var reservations = reservationRepo.findByPostingSellerSellerId(sellerId);

        // Group by window label
        Map<String, List<Reservation>> byWindow = reservations.stream()
                .collect(Collectors.groupingBy(r -> {
                    var window = r.getPosting().getWindow();
                    return window != null ? window.getLabel() : "No window";
                }));

        List<WindowRow> rows = byWindow.entrySet().stream()
                .map(e -> {
                    String label = e.getKey();
                    List<Reservation> resList = e.getValue();
                    int total = resList.size();
                    long collected = resList.stream().filter(r -> r.getStatus() == Reservation.Status.COLLECTED).count();
                    long noShow = resList.stream().filter(r -> r.getStatus() == Reservation.Status.NO_SHOW).count();
                    double rate = total > 0 ? (double) collected / total * 100 : 0;
                    return new WindowRow(label, total, (int) collected, (int) noShow,
                            Math.round(rate * 10) / 10.0);
                })
                .sorted((a, b) -> Integer.compare(b.getTotalReservations(), a.getTotalReservations()))
                .toList();

        return ResponseEntity.ok(rows);
    }

    // Popular categories endpoint
    @GetMapping("/popular-categories/{sellerId}")
    public ResponseEntity<?> getPopularCategories(@PathVariable UUID sellerId) {
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();

        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!seller.getUser().getUserId().equals(userId)) {
            return ResponseEntity.status(403).body("Access denied");
        }

        var bundles = bundleRepo.findBySeller_SellerId(sellerId);
        var reservations = reservationRepo.findByPostingSellerSellerId(sellerId);

        Map<UUID, List<Reservation>> resByPosting = reservations.stream()
                .collect(Collectors.groupingBy(r -> r.getPosting().getPostingId()));

        // Group bundles by category name
        Map<String, List<BundlePosting>> byCategory = bundles.stream()
                .collect(Collectors.groupingBy(b ->
                        b.getCategory() != null ? b.getCategory().getName() : "Uncategorised"));

        List<CategoryRow> rows = byCategory.entrySet().stream()
                .map(e -> {
                    String catName = e.getKey();
                    List<BundlePosting> catBundles = e.getValue();
                    int bundlesPosted = catBundles.size();
                    int totalQty = catBundles.stream().mapToInt(BundlePosting::getQuantityTotal).sum();
                    long collected = catBundles.stream()
                            .flatMap(b -> resByPosting.getOrDefault(b.getPostingId(), List.of()).stream())
                            .filter(r -> r.getStatus() == Reservation.Status.COLLECTED)
                            .count();
                    double sellThrough = totalQty > 0 ? (double) collected / totalQty * 100 : 0;
                    return new CategoryRow(catName, bundlesPosted, totalQty, (int) collected,
                            Math.round(sellThrough * 10) / 10.0);
                })
                .sorted((a, b) -> Integer.compare(b.getBundlesPosted(), a.getBundlesPosted()))
                .toList();

        return ResponseEntity.ok(rows);
    }

    // Waste avoided endpoint
    // Assumptions: default 1500g per bundle if weight not set (based on OLIO/TGTG averages),
    // 2.5 kg CO2e per kg food waste avoided (WRAP UK data)
    @GetMapping("/waste-avoided/{sellerId}")
    public ResponseEntity<?> getWasteAvoided(@PathVariable UUID sellerId) {
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();

        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!seller.getUser().getUserId().equals(userId)) {
            return ResponseEntity.status(403).body("Access denied");
        }

        var reservations = reservationRepo.findByPostingSellerSellerId(sellerId);
        var collected = reservations.stream()
                .filter(r -> r.getStatus() == Reservation.Status.COLLECTED)
                .toList();

        int totalBundlesCollected = collected.size();
        long totalWeightGrams = 0;
        for (var r : collected) {
            Integer weight = r.getPosting().getEstimatedWeightGrams();
            totalWeightGrams += (weight != null && weight > 0) ? weight : 1500;
        }

        double wasteAvoidedKg = totalWeightGrams / 1000.0;
        double co2eAvoidedKg = wasteAvoidedKg * 2.5;
        double avgWeightPerBundle = totalBundlesCollected > 0
                ? (double) totalWeightGrams / totalBundlesCollected / 1000.0 : 0;

        return ResponseEntity.ok(new WasteAvoidedResponse(
                totalWeightGrams, Math.round(wasteAvoidedKg * 10) / 10.0,
                Math.round(co2eAvoidedKg * 10) / 10.0,
                Math.round(avgWeightPerBundle * 10) / 10.0,
                totalBundlesCollected));
    }

    // Waste avoided DTO
    public static class WasteAvoidedResponse {
        private long wasteAvoidedGrams;
        private double wasteAvoidedKg;
        private double co2eAvoidedKg;
        private double avgWeightPerBundleKg;
        private int totalBundlesCollected;

        public WasteAvoidedResponse(long wasteAvoidedGrams, double wasteAvoidedKg, double co2eAvoidedKg,
                                     double avgWeightPerBundleKg, int totalBundlesCollected) {
            this.wasteAvoidedGrams = wasteAvoidedGrams;
            this.wasteAvoidedKg = wasteAvoidedKg;
            this.co2eAvoidedKg = co2eAvoidedKg;
            this.avgWeightPerBundleKg = avgWeightPerBundleKg;
            this.totalBundlesCollected = totalBundlesCollected;
        }

        public long getWasteAvoidedGrams() { return wasteAvoidedGrams; }
        public double getWasteAvoidedKg() { return wasteAvoidedKg; }
        public double getCo2eAvoidedKg() { return co2eAvoidedKg; }
        public double getAvgWeightPerBundleKg() { return avgWeightPerBundleKg; }
        public int getTotalBundlesCollected() { return totalBundlesCollected; }
    }

    // Pricing effectiveness DTO
    public static class PricingRow {
        private String bracket;
        private int bundleCount;
        private int totalQuantity;
        private int collectedCount;
        private double sellThroughRate;

        public PricingRow(String bracket, int bundleCount, int totalQuantity, int collectedCount, double sellThroughRate) {
            this.bracket = bracket;
            this.bundleCount = bundleCount;
            this.totalQuantity = totalQuantity;
            this.collectedCount = collectedCount;
            this.sellThroughRate = sellThroughRate;
        }

        public String getBracket() { return bracket; }
        public int getBundleCount() { return bundleCount; }
        public int getTotalQuantity() { return totalQuantity; }
        public int getCollectedCount() { return collectedCount; }
        public double getSellThroughRate() { return sellThroughRate; }
    }

    // Window popularity DTO
    public static class WindowRow {
        private String windowLabel;
        private int totalReservations;
        private int collectedCount;
        private int noShowCount;
        private double collectionRate;

        public WindowRow(String windowLabel, int totalReservations, int collectedCount, int noShowCount, double collectionRate) {
            this.windowLabel = windowLabel;
            this.totalReservations = totalReservations;
            this.collectedCount = collectedCount;
            this.noShowCount = noShowCount;
            this.collectionRate = collectionRate;
        }

        public String getWindowLabel() { return windowLabel; }
        public int getTotalReservations() { return totalReservations; }
        public int getCollectedCount() { return collectedCount; }
        public int getNoShowCount() { return noShowCount; }
        public double getCollectionRate() { return collectionRate; }
    }

    // Category popularity DTO
    public static class CategoryRow {
        private String categoryName;
        private int bundlesPosted;
        private int totalQuantity;
        private int collectedCount;
        private double sellThroughRate;

        public CategoryRow(String categoryName, int bundlesPosted, int totalQuantity, int collectedCount, double sellThroughRate) {
            this.categoryName = categoryName;
            this.bundlesPosted = bundlesPosted;
            this.totalQuantity = totalQuantity;
            this.collectedCount = collectedCount;
            this.sellThroughRate = sellThroughRate;
        }

        public String getCategoryName() { return categoryName; }
        public int getBundlesPosted() { return bundlesPosted; }
        public int getTotalQuantity() { return totalQuantity; }
        public int getCollectedCount() { return collectedCount; }
        public double getSellThroughRate() { return sellThroughRate; }
    }
}
