package com.byteme.app;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/forecast")
public class ForecastController {

    private final ForecastService forecastService;
    private final DemandObservationRepository observationRepo;
    private final ForecastRunRepository runRepo;
    private final ForecastOutputRepository outputRepo;
    private final SellerMetricsWeeklyRepository metricsRepo;
    private final SellerRepository sellerRepo;
    private final BundlePostingRepository bundleRepo;
    private final ForecastActionRepository actionRepo;

    public ForecastController(ForecastService forecastService,
                              DemandObservationRepository observationRepo,
                              ForecastRunRepository runRepo,
                              ForecastOutputRepository outputRepo,
                              SellerMetricsWeeklyRepository metricsRepo,
                              SellerRepository sellerRepo,
                              BundlePostingRepository bundleRepo,
                              ForecastActionRepository actionRepo) {
        this.forecastService = forecastService;
        this.observationRepo = observationRepo;
        this.runRepo = runRepo;
        this.outputRepo = outputRepo;
        this.metricsRepo = metricsRepo;
        this.sellerRepo = sellerRepo;
        this.bundleRepo = bundleRepo;
        this.actionRepo = actionRepo;
    }

    // Check that the current user owns this seller profile
    private ResponseEntity<?> checkSellerOwnership(Seller seller) {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!seller.getUser().getUserId().equals(userId)) {
            return ResponseEntity.status(403).body("Access denied");
        }
        return null;
    }

    // Get demand observation history for a seller
    @GetMapping("/history/{sellerId}")
    public ResponseEntity<?> getHistory(@PathVariable UUID sellerId) {
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();
        var denied = checkSellerOwnership(seller);
        if (denied != null) return denied;

        var observations = observationRepo.findBySellerSellerIdOrderByDateDesc(sellerId);
        var result = observations.stream().map(o -> Map.of(
                "obsId", (Object) o.getObsId(),
                "date", o.getDate().toString(),
                "dayOfWeek", o.getDayOfWeek(),
                "categoryName", o.getCategory().getName(),
                "windowLabel", o.getWindow().getLabel(),
                "discountPct", o.getDiscountPct(),
                "weatherFlag", o.isWeatherFlag(),
                "observedReservations", o.getObservedReservations(),
                "observedNoShowRate", o.getObservedNoShowRate()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // Get latest forecast outputs for a seller's postings
    @GetMapping("/{sellerId}")
    public ResponseEntity<?> getForecasts(@PathVariable UUID sellerId) {
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();
        var denied = checkSellerOwnership(seller);
        if (denied != null) return denied;

        var outputs = outputRepo.findBySellerId(sellerId);
        var result = outputs.stream().map(o -> Map.of(
                "outputId", (Object) o.getOutputId(),
                "modelName", o.getRun().getModelName(),
                "postingId", o.getPosting().getPostingId(),
                "postingTitle", o.getPosting().getTitle(),
                "predictedReservations", o.getPredictedReservations(),
                "predictedNoShowProb", o.getPredictedNoShowProb(),
                "confidence", o.getConfidence(),
                "rationaleText", o.getRationaleText() != null ? o.getRationaleText() : ""
        )).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // Evaluate all 3 models on held-out data (read-only, no DB writes)
    @GetMapping("/evaluate/{sellerId}")
    public ResponseEntity<?> evaluateModels(@PathVariable UUID sellerId) {
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();
        var denied = checkSellerOwnership(seller);
        if (denied != null) return denied;

        var result = forecastService.evaluateModels(sellerId);
        return ResponseEntity.ok(result);
    }

    // Get model comparison metrics for a seller
    @GetMapping("/comparison/{sellerId}")
    public ResponseEntity<?> getComparison(@PathVariable UUID sellerId) {
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();
        var denied = checkSellerOwnership(seller);
        if (denied != null) return denied;

        var runs = runRepo.findAllByOrderByTrainedAtDesc();
        var result = runs.stream().map(r -> Map.of(
                "runId", (Object) r.getRunId(),
                "modelName", r.getModelName(),
                "trainedAt", r.getTrainedAt().toString(),
                "trainStart", r.getTrainStart() != null ? r.getTrainStart().toString() : "",
                "trainEnd", r.getTrainEnd() != null ? r.getTrainEnd().toString() : "",
                "evalStart", r.getEvalStart() != null ? r.getEvalStart().toString() : "",
                "evalEnd", r.getEvalEnd() != null ? r.getEvalEnd().toString() : "",
                "metricsJson", r.getMetricsJson() != null ? r.getMetricsJson() : "{}"
        )).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // Get recommendations for a seller's active postings
    @GetMapping("/recommendations/{sellerId}")
    public ResponseEntity<?> getRecommendations(@PathVariable UUID sellerId) {
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();
        var denied = checkSellerOwnership(seller);
        if (denied != null) return denied;

        var postings = bundleRepo.findBySeller_SellerId(sellerId).stream()
                .filter(p -> p.getStatus() == BundlePosting.Status.ACTIVE)
                .collect(Collectors.toList());

        var observations = observationRepo.findBySellerSellerIdOrderByDateDesc(sellerId);

        var result = postings.stream().map(posting -> {
            List<DemandObservation> postingObs = observations.stream()
                    .filter(o -> posting.getCategory() != null &&
                            o.getCategory().getCategoryId().equals(posting.getCategory().getCategoryId()) &&
                            posting.getWindow() != null &&
                            o.getWindow().getWindowId().equals(posting.getWindow().getWindowId()))
                    .collect(Collectors.toList());
            if (postingObs.isEmpty()) postingObs = observations;

            ForecastService.Prediction pred = forecastService.chosenModel(postingObs, posting);
            String recommendation = forecastService.generateRecommendation(posting, pred);

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("postingId", posting.getPostingId());
            map.put("postingTitle", posting.getTitle());
            map.put("currentQuantity", posting.getQuantityTotal());
            map.put("recommendedQuantity", (int) Math.round(pred.reservations));
            map.put("predictedReservations", pred.reservations);
            map.put("noShowProb", pred.noShowProb);
            map.put("confidence", pred.confidence);
            map.put("rationale", pred.rationale);
            map.put("recommendation", recommendation);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // Trigger a new forecast run
    @PostMapping("/run/{sellerId}")
    public ResponseEntity<?> runForecast(@PathVariable UUID sellerId) {
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();
        var denied = checkSellerOwnership(seller);
        if (denied != null) return denied;

        var result = forecastService.runForecast(sellerId);
        return ResponseEntity.ok(result);
    }

    // Record an action taken based on a forecast recommendation
    @PostMapping("/actions/{sellerId}")
    public ResponseEntity<?> recordAction(@PathVariable UUID sellerId, @RequestBody Map<String, String> body) {
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();
        var denied = checkSellerOwnership(seller);
        if (denied != null) return denied;

        String actionType = body.get("actionType");
        if (actionType == null || actionType.isBlank()) {
            return ResponseEntity.badRequest().body("actionType is required");
        }

        ForecastAction action = new ForecastAction();
        action.setSeller(seller);
        action.setActionType(actionType);
        action.setNotes(body.get("notes"));

        String postingId = body.get("postingId");
        if (postingId != null && !postingId.isBlank()) {
            var posting = bundleRepo.findById(UUID.fromString(postingId)).orElse(null);
            if (posting != null) {
                action.setPosting(posting);
            }
        }

        actionRepo.save(action);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("actionId", action.getActionId());
        result.put("actionType", action.getActionType());
        result.put("notes", action.getNotes() != null ? action.getNotes() : "");
        result.put("postingTitle", action.getPosting() != null ? action.getPosting().getTitle() : "");
        result.put("createdAt", action.getCreatedAt().toString());
        return ResponseEntity.ok(result);
    }

    // Get recorded forecast actions for a seller
    @GetMapping("/actions/{sellerId}")
    public ResponseEntity<?> getActions(@PathVariable UUID sellerId) {
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();
        var denied = checkSellerOwnership(seller);
        if (denied != null) return denied;

        var actions = actionRepo.findBySellerSellerIdOrderByCreatedAtDesc(sellerId);
        var result = actions.stream().map(a -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("actionId", a.getActionId());
            map.put("actionType", a.getActionType());
            map.put("notes", a.getNotes() != null ? a.getNotes() : "");
            map.put("postingTitle", a.getPosting() != null ? a.getPosting().getTitle() : "");
            map.put("createdAt", a.getCreatedAt().toString());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // Get weekly seller metrics
    @GetMapping("/metrics/{sellerId}")
    public ResponseEntity<?> getMetrics(@PathVariable UUID sellerId) {
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();
        var denied = checkSellerOwnership(seller);
        if (denied != null) return denied;

        var metrics = metricsRepo.findBySellerIdOrderByWeekStartDesc(sellerId);
        var result = metrics.stream().map(m -> Map.of(
                "weekStart", (Object) m.getWeekStart().toString(),
                "postedCount", m.getPostedCount(),
                "reservedCount", m.getReservedCount(),
                "collectedCount", m.getCollectedCount(),
                "noShowCount", m.getNoShowCount(),
                "expiredCount", m.getExpiredCount(),
                "sellThroughRate", m.getSellThroughRate(),
                "wasteAvoidedGrams", m.getWasteAvoidedGrams()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
