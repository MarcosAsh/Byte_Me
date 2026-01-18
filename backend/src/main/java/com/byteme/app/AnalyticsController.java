package com.byteme.app;

import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final BundlePostingRepository bundleRepo;
    private final ReservationRepository reservationRepo;
    private final IssueReportRepository issueRepo;
    private final SellerRepository sellerRepo;

    @GetMapping("/dashboard/{sellerId}")
    public ResponseEntity<?> getDashboard(@PathVariable UUID sellerId) {
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();

        var bundles = bundleRepo.findBySeller_SellerId(sellerId);
        
        int totalPosted = bundles.size();
        int totalQuantity = bundles.stream().mapToInt(BundlePosting::getQuantityTotal).sum();
        
        var collected = reservationRepo.findBySellerAndStatus(sellerId, Reservation.Status.COLLECTED);
        var noShows = reservationRepo.findBySellerAndStatus(sellerId, Reservation.Status.NO_SHOW);
        var expired = reservationRepo.findBySellerAndStatus(sellerId, Reservation.Status.EXPIRED);
        
        int collectedCount = collected.size();
        int noShowCount = noShows.size();
        int expiredCount = expired.size();
        
        double sellThrough = totalQuantity > 0 ? (double) collectedCount / totalQuantity * 100 : 0;
        
        // Estimate waste avoided (assume 300g per bundle)
        int wasteAvoidedGrams = collectedCount * 300;
        
        int openIssues = issueRepo.findOpenBySeller(sellerId).size();

        return ResponseEntity.ok(new DashboardResponse(
                seller.getName(),
                totalPosted,
                totalQuantity,
                collectedCount,
                noShowCount,
                expiredCount,
                Math.round(sellThrough * 10) / 10.0,
                wasteAvoidedGrams,
                openIssues
        ));
    }

    @GetMapping("/sell-through/{sellerId}")
    public ResponseEntity<?> getSellThrough(@PathVariable UUID sellerId) {
        var collected = reservationRepo.findBySellerAndStatus(sellerId, Reservation.Status.COLLECTED);
        var noShows = reservationRepo.findBySellerAndStatus(sellerId, Reservation.Status.NO_SHOW);
        var expired = reservationRepo.findBySellerAndStatus(sellerId, Reservation.Status.EXPIRED);
        
        int total = collected.size() + noShows.size() + expired.size();
        
        return ResponseEntity.ok(new SellThroughResponse(
                collected.size(),
                noShows.size(),
                expired.size(),
                total > 0 ? (double) collected.size() / total * 100 : 0,
                total > 0 ? (double) noShows.size() / total * 100 : 0
        ));
    }

    @GetMapping("/waste/{sellerId}")
    public ResponseEntity<?> getWasteMetrics(@PathVariable UUID sellerId) {
        var collected = reservationRepo.findBySellerAndStatus(sellerId, Reservation.Status.COLLECTED);
        
        // Assumptions documented as required by spec
        int bundlesCollected = collected.size();
        int weightSavedGrams = bundlesCollected * 300; // Assume 300g per bundle
        double co2eSavedKg = weightSavedGrams * 2.5 / 1000; // 2.5 kg CO2e per kg food
        int mealsSaved = bundlesCollected; // 1 meal per bundle

        return ResponseEntity.ok(new WasteResponse(
                bundlesCollected,
                weightSavedGrams,
                co2eSavedKg,
                mealsSaved,
                "Average bundle weight: 300g",
                "CO2e factor: 2.5 kg CO2e per kg food waste avoided",
                "Meals estimate: 1 meal per bundle"
        ));
    }

    // DTOs
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class DashboardResponse {
        String sellerName;
        int totalBundlesPosted;
        int totalQuantity;
        int collectedCount;
        int noShowCount;
        int expiredCount;
        double sellThroughRate;
        int wasteAvoidedGrams;
        int openIssueCount;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class SellThroughResponse {
        int collected;
        int noShow;
        int expired;
        double collectionRate;
        double noShowRate;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class WasteResponse {
        int bundlesCollected;
        int weightSavedGrams;
        double co2eSavedKg;
        int mealsSaved;
        String weightAssumption;
        String co2eAssumption;
        String mealsAssumption;
    }
}
