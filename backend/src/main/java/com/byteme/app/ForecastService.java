package com.byteme.app;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ForecastService {

    private final DemandObservationRepository observationRepo;
    private final ForecastRunRepository runRepo;
    private final ForecastOutputRepository outputRepo;
    private final BundlePostingRepository postingRepo;

    public ForecastService(DemandObservationRepository observationRepo,
                           ForecastRunRepository runRepo,
                           ForecastOutputRepository outputRepo,
                           BundlePostingRepository postingRepo) {
        this.observationRepo = observationRepo;
        this.runRepo = runRepo;
        this.outputRepo = outputRepo;
        this.postingRepo = postingRepo;
    }

    // Prediction result container
    public static class Prediction {
        public final double reservations;
        public final double noShowProb;
        public final double confidence;
        public final String rationale;

        public Prediction(double reservations, double noShowProb, double confidence, String rationale) {
            this.reservations = reservations;
            this.noShowProb = noShowProb;
            this.confidence = confidence;
            this.rationale = rationale;
        }
    }

    // Baseline 1: Moving Average (4-week window)
    public Prediction movingAverage(List<DemandObservation> observations, int windowWeeks) {
        if (observations.isEmpty()) {
            return new Prediction(0, 0, 0, "No historical data available.");
        }

        // Sort by date descending, take last N weeks
        List<DemandObservation> sorted = observations.stream()
                .sorted(Comparator.comparing(DemandObservation::getDate).reversed())
                .limit(windowWeeks)
                .collect(Collectors.toList());

        double avgRes = sorted.stream().mapToInt(DemandObservation::getObservedReservations).average().orElse(0);
        double avgNoShow = sorted.stream().mapToDouble(DemandObservation::getObservedNoShowRate).average().orElse(0);

        double confidence = Math.min(0.3 + (sorted.size() / (double) windowWeeks) * 0.4, 0.7);

        String rationale = String.format(
                "Moving average (%dw): mean of last %d observations = %.1f reservations. No-show prob = %.2f (mean of recent rates).",
                windowWeeks, sorted.size(), avgRes, avgNoShow);

        return new Prediction(Math.round(avgRes * 10) / 10.0, Math.round(avgNoShow * 100) / 100.0, confidence, rationale);
    }

    // Baseline 2: Seasonal Naive (ISO Day of Week)
    public Prediction seasonalNaive(List<DemandObservation> observations, int targetDayOfWeek) {
        if (observations.isEmpty()) {
            return new Prediction(0, 0, 0, "No historical data available.");
        }

        // Find most recent observation with same day of week
        Optional<DemandObservation> sameDow = observations.stream()
                .filter(o -> o.getDayOfWeek() == targetDayOfWeek)
                .max(Comparator.comparing(DemandObservation::getDate));

        if (sameDow.isPresent()) {
            DemandObservation obs = sameDow.get();
            String rationale = String.format(
                    "Seasonal naive: last value for ISO day %d (date %s) = %d reservations, no-show = %.2f.",
                    targetDayOfWeek, obs.getDate(), obs.getObservedReservations(), obs.getObservedNoShowRate());
            return new Prediction(obs.getObservedReservations(), obs.getObservedNoShowRate(), 0.5, rationale);
        }

        // Fallback to most recent observation
        DemandObservation latest = observations.stream()
                .max(Comparator.comparing(DemandObservation::getDate))
                .get();
        String rationale = String.format(
                "Seasonal naive: no match for ISO day %d, using latest observation (date %s) = %d reservations.",
                targetDayOfWeek, latest.getDate(), latest.getObservedReservations());
        return new Prediction(latest.getObservedReservations(), latest.getObservedNoShowRate(), 0.35, rationale);
    }

    // Chosen Model: EMA-weighted with feature factors
    public Prediction chosenModel(List<DemandObservation> observations, BundlePosting posting) {
        if (observations.isEmpty()) {
            return new Prediction(0, 0, 0, "No historical data available.");
        }

        // Sort by date ascending for EMA calculation
        List<DemandObservation> sorted = observations.stream()
                .sorted(Comparator.comparing(DemandObservation::getDate))
                .collect(Collectors.toList());

        // Exponential moving average of reservations (alpha = 0.3)
        double alpha = 0.3;
        double emaReservations = sorted.get(0).getObservedReservations();
        double emaNoShow = sorted.get(0).getObservedNoShowRate();

        for (int i = 1; i < sorted.size(); i++) {
            emaReservations = alpha * sorted.get(i).getObservedReservations() + (1 - alpha) * emaReservations;
            emaNoShow = alpha * sorted.get(i).getObservedNoShowRate() + (1 - alpha) * emaNoShow;
        }

        // Day-of-week factor: adjust for weekly seasonality
        int targetDow = LocalDate.now().getDayOfWeek().getValue();
        double dowFactor = 1.0;
        List<DemandObservation> sameDow = sorted.stream()
                .filter(o -> o.getDayOfWeek() == targetDow)
                .collect(Collectors.toList());
        if (!sameDow.isEmpty()) {
            double dowAvg = sameDow.stream()
                    .mapToInt(DemandObservation::getObservedReservations).average().orElse(emaReservations);
            double overallAvg = sorted.stream()
                    .mapToInt(DemandObservation::getObservedReservations).average().orElse(emaReservations);
            if (overallAvg > 0) {
                dowFactor = dowAvg / overallAvg;
                dowFactor = Math.max(0.7, Math.min(1.4, dowFactor));
            }
        }

        // Weather factor: bad weather reduces demand and increases no-shows
        boolean hasWeatherData = sorted.stream().anyMatch(DemandObservation::isWeatherFlag);
        double weatherFactor = 1.0;
        double weatherNoShowFactor = 1.0;
        if (hasWeatherData) {
            double weatherAvg = sorted.stream().filter(DemandObservation::isWeatherFlag)
                    .mapToInt(DemandObservation::getObservedReservations).average().orElse(emaReservations);
            double noWeatherAvg = sorted.stream().filter(o -> !o.isWeatherFlag())
                    .mapToInt(DemandObservation::getObservedReservations).average().orElse(emaReservations);
            if (noWeatherAvg > 0) {
                weatherFactor = weatherAvg / noWeatherAvg;
            }
            double weatherNoShow = sorted.stream().filter(DemandObservation::isWeatherFlag)
                    .mapToDouble(DemandObservation::getObservedNoShowRate).average().orElse(emaNoShow);
            double clearNoShow = sorted.stream().filter(o -> !o.isWeatherFlag())
                    .mapToDouble(DemandObservation::getObservedNoShowRate).average().orElse(emaNoShow);
            if (clearNoShow > 0) {
                weatherNoShowFactor = weatherNoShow / clearNoShow;
            }
        }

        // Discount factor: higher discounts boost demand
        int postingDiscount = posting.getDiscountPct();
        double avgDiscount = sorted.stream().mapToInt(DemandObservation::getDiscountPct).average().orElse(postingDiscount);
        double discountFactor = 1.0;
        if (avgDiscount > 0) {
            discountFactor = 1.0 + (postingDiscount - avgDiscount) / avgDiscount * 0.2;
        }

        // Trend factor: recent direction for both reservations and no-shows
        double recentAvg = sorted.stream()
                .skip(Math.max(0, sorted.size() - 3))
                .mapToInt(DemandObservation::getObservedReservations)
                .average().orElse(emaReservations);
        double olderAvg = sorted.stream()
                .limit(Math.max(1, sorted.size() / 2))
                .mapToInt(DemandObservation::getObservedReservations)
                .average().orElse(emaReservations);
        double trendFactor = olderAvg > 0 ? recentAvg / olderAvg : 1.0;
        trendFactor = Math.max(0.8, Math.min(1.3, trendFactor));

        double recentNoShow = sorted.stream()
                .skip(Math.max(0, sorted.size() - 3))
                .mapToDouble(DemandObservation::getObservedNoShowRate)
                .average().orElse(emaNoShow);
        double olderNoShow = sorted.stream()
                .limit(Math.max(1, sorted.size() / 2))
                .mapToDouble(DemandObservation::getObservedNoShowRate)
                .average().orElse(emaNoShow);
        double noShowTrendFactor = olderNoShow > 0 ? recentNoShow / olderNoShow : 1.0;
        noShowTrendFactor = Math.max(0.7, Math.min(1.5, noShowTrendFactor));

        // Apply all factors to reservation prediction (weather was previously computed but not applied)
        double predicted = emaReservations * weatherFactor * discountFactor * trendFactor * dowFactor;
        predicted = Math.round(predicted * 10) / 10.0;

        // Apply weather and trend factors to no-show prediction
        double predictedNoShow = emaNoShow * weatherNoShowFactor * noShowTrendFactor;
        predictedNoShow = Math.max(0, Math.min(1.0, predictedNoShow));
        predictedNoShow = Math.round(predictedNoShow * 100) / 100.0;

        double confidence = Math.min(0.4 + sorted.size() * 0.03, 0.85);

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("EMA-weighted model (alpha=%.1f) using %d observations. ", alpha, sorted.size()));
        sb.append(String.format("Base EMA = %.1f. ", emaReservations));
        if (Math.abs(dowFactor - 1.0) > 0.02) {
            sb.append(String.format("Day-of-week adjustment (factor=%.2f). ", dowFactor));
        }
        if (Math.abs(weatherFactor - 1.0) > 0.02) {
            sb.append(String.format("Weather effect (factor=%.2f). ", weatherFactor));
        }
        if (Math.abs(trendFactor - 1.0) > 0.02) {
            sb.append(String.format("Trend %s (factor=%.2f). ", trendFactor > 1 ? "up" : "down", trendFactor));
        }
        if (Math.abs(discountFactor - 1.0) > 0.02) {
            sb.append(String.format("Discount=%d%% effect (factor=%.2f). ", postingDiscount, discountFactor));
        }
        sb.append(String.format("Predicted reservations = %.1f, no-show prob = %.2f.", predicted, predictedNoShow));

        return new Prediction(predicted, predictedNoShow, confidence, sb.toString());
    }

    // Error metrics (MAE, RMSE, Brier score)
    public static double calculateMAE(List<Double> predicted, List<Integer> actual) {
        if (predicted.size() != actual.size() || predicted.isEmpty()) return 0;
        double sum = 0;
        for (int i = 0; i < predicted.size(); i++) {
            sum += Math.abs(predicted.get(i) - actual.get(i));
        }
        return Math.round(sum / predicted.size() * 100) / 100.0;
    }

    public static double calculateRMSE(List<Double> predicted, List<Integer> actual) {
        if (predicted.size() != actual.size() || predicted.isEmpty()) return 0;
        double sum = 0;
        for (int i = 0; i < predicted.size(); i++) {
            double diff = predicted.get(i) - actual.get(i);
            sum += diff * diff;
        }
        return Math.round(Math.sqrt(sum / predicted.size()) * 100) / 100.0;
    }

    public static double calculateBrierScore(List<Double> predictedProbs, List<Double> actualRates) {
        if (predictedProbs.size() != actualRates.size() || predictedProbs.isEmpty()) return 0;
        double sum = 0;
        for (int i = 0; i < predictedProbs.size(); i++) {
            double diff = predictedProbs.get(i) - actualRates.get(i);
            sum += diff * diff;
        }
        return Math.round(sum / predictedProbs.size() * 1000) / 1000.0;
    }

    // Generates posting recommendations, accounting for predicted no-shows
    public String generateRecommendation(BundlePosting posting, Prediction prediction) {
        int current = posting.getQuantityTotal();
        double predictedDemand = prediction.reservations;

        // Adjust recommended quantity upward to compensate for expected no-shows
        // e.g. if 10 predicted reservations and 20% no-show, post ~12 to still fulfil demand
        double noShowBuffer = prediction.noShowProb > 0.05
                ? predictedDemand * prediction.noShowProb
                : 0;
        int recommended = (int) Math.round(predictedDemand + noShowBuffer);

        StringBuilder sb = new StringBuilder();
        if (recommended < current) {
            sb.append(String.format("Recommend posting ~%d bundles instead of %d", recommended, current));
            sb.append(String.format(" for %s to reduce waste.", posting.getTitle()));
        } else if (recommended > current) {
            sb.append(String.format("Demand (~%d) exceeds current quantity (%d)", recommended, current));
            sb.append(String.format(" for %s. Consider increasing supply.", posting.getTitle()));
        } else {
            sb.append(String.format("Current quantity (%d) aligns well with predicted demand for %s.",
                    current, posting.getTitle()));
        }

        if (prediction.noShowProb > 0.15) {
            sb.append(String.format(" No-show risk is elevated (%.0f%%); recommended quantity includes buffer for expected no-shows.",
                    prediction.noShowProb * 100));
        }

        sb.append(String.format(" Confidence: %.0f%%.", prediction.confidence * 100));

        return sb.toString();
    }

    // Pick the best model based on evaluation MAE, falling back to EMA if no eval data
    private Prediction selectBestPrediction(Prediction ma, Prediction sn, Prediction em,
                                             List<Double> maPredicted, List<Double> snPredicted,
                                             List<Double> emPredicted, List<Integer> actualRes) {
        if (actualRes.isEmpty()) return em;

        double maMae = calculateMAE(maPredicted, actualRes);
        double snMae = calculateMAE(snPredicted, actualRes);
        double emMae = calculateMAE(emPredicted, actualRes);

        if (maMae <= snMae && maMae <= emMae) return ma;
        if (snMae <= emMae) return sn;
        return em;
    }

    // Read-only evaluation: runs all 3 models on train/eval split without saving anything
    public Map<String, Object> evaluateModels(UUID sellerId) {
        List<DemandObservation> allObs = observationRepo.findBySellerSellerIdOrderByDateDesc(sellerId);

        if (allObs.isEmpty()) {
            return Map.of("error", "No demand observation history found for this seller.");
        }

        List<DemandObservation> sorted = allObs.stream()
                .sorted(Comparator.comparing(DemandObservation::getDate))
                .collect(Collectors.toList());
        int splitIdx = (int) (sorted.size() * 0.8);
        List<DemandObservation> train = sorted.subList(0, Math.max(1, splitIdx));
        List<DemandObservation> eval = sorted.subList(Math.max(1, splitIdx), sorted.size());

        LocalDate trainStart = train.get(0).getDate();
        LocalDate trainEnd = train.get(train.size() - 1).getDate();
        LocalDate evalStart = eval.isEmpty() ? trainEnd : eval.get(0).getDate();
        LocalDate evalEnd = eval.isEmpty() ? trainEnd : eval.get(eval.size() - 1).getDate();

        List<Double> maPred = new ArrayList<>(), snPred = new ArrayList<>(), emPred = new ArrayList<>();
        List<Integer> actualRes = new ArrayList<>();
        List<Double> maNoShow = new ArrayList<>(), snNoShow = new ArrayList<>(), emNoShow = new ArrayList<>();
        List<Double> actualNoShow = new ArrayList<>();
        List<Map<String, Object>> samples = new ArrayList<>();

        for (DemandObservation obs : eval) {
            List<DemandObservation> prior = train.stream()
                    .filter(o -> o.getSeller().getSellerId().equals(obs.getSeller().getSellerId())
                            && o.getCategory().getCategoryId().equals(obs.getCategory().getCategoryId())
                            && o.getWindow().getWindowId().equals(obs.getWindow().getWindowId()))
                    .collect(Collectors.toList());
            if (prior.isEmpty()) continue;

            Prediction ma = movingAverage(prior, 4);
            Prediction sn = seasonalNaive(prior, obs.getDayOfWeek());
            BundlePosting dummy = new BundlePosting();
            dummy.setDiscountPct(obs.getDiscountPct());
            dummy.setQuantityTotal(obs.getObservedReservations());
            Prediction em = chosenModel(prior, dummy);

            maPred.add(ma.reservations); snPred.add(sn.reservations); emPred.add(em.reservations);
            actualRes.add(obs.getObservedReservations());
            maNoShow.add(ma.noShowProb); snNoShow.add(sn.noShowProb); emNoShow.add(em.noShowProb);
            actualNoShow.add(obs.getObservedNoShowRate());

            if (samples.size() < 5) {
                Map<String, Object> sample = new LinkedHashMap<>();
                sample.put("date", obs.getDate().toString());
                sample.put("category", obs.getCategory().getName());
                sample.put("window", obs.getWindow().getLabel());
                sample.put("actual", obs.getObservedReservations());
                sample.put("movingAvg", ma.reservations);
                sample.put("seasonalNaive", sn.reservations);
                sample.put("emaWeighted", em.reservations);
                samples.add(sample);
            }
        }

        Map<String, Object> maMetrics = Map.of(
                "mae", calculateMAE(maPred, actualRes),
                "rmse", calculateRMSE(maPred, actualRes),
                "brierScore", calculateBrierScore(maNoShow, actualNoShow));
        Map<String, Object> snMetrics = Map.of(
                "mae", calculateMAE(snPred, actualRes),
                "rmse", calculateRMSE(snPred, actualRes),
                "brierScore", calculateBrierScore(snNoShow, actualNoShow));
        Map<String, Object> emMetrics = Map.of(
                "mae", calculateMAE(emPred, actualRes),
                "rmse", calculateRMSE(emPred, actualRes),
                "brierScore", calculateBrierScore(emNoShow, actualNoShow));

        // Find best model by lowest MAE
        double maMae = (double) maMetrics.get("mae");
        double snMae = (double) snMetrics.get("mae");
        double emMae = (double) emMetrics.get("mae");
        String bestModel = emMae <= maMae && emMae <= snMae ? "EMA-Weighted (Chosen)"
                : maMae <= snMae ? "Moving Average (4w)" : "Seasonal Naive (ISO DOW)";

        return Map.of(
                "models", List.of(
                        Map.of("name", "Moving Average (4w)", "metrics", maMetrics, "best", bestModel.equals("Moving Average (4w)")),
                        Map.of("name", "Seasonal Naive (ISO DOW)", "metrics", snMetrics, "best", bestModel.equals("Seasonal Naive (ISO DOW)")),
                        Map.of("name", "EMA-Weighted (Chosen)", "metrics", emMetrics, "best", bestModel.equals("EMA-Weighted (Chosen)"))
                ),
                "trainPeriod", Map.of("start", trainStart.toString(), "end", trainEnd.toString()),
                "evalPeriod", Map.of("start", evalStart.toString(), "end", evalEnd.toString()),
                "evalPoints", actualRes.size(),
                "samples", samples,
                "bestModel", bestModel
        );
    }

    // Runs the full forecast pipeline for a seller: train/eval split, all 3 models, saves results
    @Transactional
    public Map<String, Object> runForecast(UUID sellerId) {
        List<DemandObservation> allObs = observationRepo.findBySellerSellerIdOrderByDateDesc(sellerId);
        List<BundlePosting> postings = postingRepo.findBySeller_SellerId(sellerId).stream()
                .filter(p -> p.getStatus() == BundlePosting.Status.ACTIVE)
                .collect(Collectors.toList());

        if (allObs.isEmpty()) {
            return Map.of("error", "No demand observation history found for this seller.");
        }

        // Split into train (first 80%) and eval (last 20%)
        List<DemandObservation> sorted = allObs.stream()
                .sorted(Comparator.comparing(DemandObservation::getDate))
                .collect(Collectors.toList());
        int splitIdx = (int) (sorted.size() * 0.8);
        List<DemandObservation> train = sorted.subList(0, Math.max(1, splitIdx));
        List<DemandObservation> eval = sorted.subList(Math.max(1, splitIdx), sorted.size());

        LocalDate trainStart = train.get(0).getDate();
        LocalDate trainEnd = train.get(train.size() - 1).getDate();
        LocalDate evalStart = eval.isEmpty() ? trainEnd : eval.get(0).getDate();
        LocalDate evalEnd = eval.isEmpty() ? trainEnd : eval.get(eval.size() - 1).getDate();

        // Compute baselines on eval set
        List<Double> maPredicted = new ArrayList<>();
        List<Double> snPredicted = new ArrayList<>();
        List<Double> emPredicted = new ArrayList<>();
        List<Integer> actualRes = new ArrayList<>();
        List<Double> maNoShowPred = new ArrayList<>();
        List<Double> snNoShowPred = new ArrayList<>();
        List<Double> emNoShowPred = new ArrayList<>();
        List<Double> actualNoShow = new ArrayList<>();

        for (DemandObservation obs : eval) {
            // Get observations prior to this eval point
            List<DemandObservation> prior = train.stream()
                    .filter(o -> o.getSeller().getSellerId().equals(obs.getSeller().getSellerId())
                            && o.getCategory().getCategoryId().equals(obs.getCategory().getCategoryId())
                            && o.getWindow().getWindowId().equals(obs.getWindow().getWindowId()))
                    .collect(Collectors.toList());

            if (prior.isEmpty()) continue;

            Prediction ma = movingAverage(prior, 4);
            Prediction sn = seasonalNaive(prior, obs.getDayOfWeek());

            // For chosen model, create a dummy posting to pass
            BundlePosting dummyPosting = new BundlePosting();
            dummyPosting.setDiscountPct(obs.getDiscountPct());
            dummyPosting.setQuantityTotal(obs.getObservedReservations());
            Prediction em = chosenModel(prior, dummyPosting);

            maPredicted.add(ma.reservations);
            snPredicted.add(sn.reservations);
            emPredicted.add(em.reservations);
            actualRes.add(obs.getObservedReservations());

            maNoShowPred.add(ma.noShowProb);
            snNoShowPred.add(sn.noShowProb);
            emNoShowPred.add(em.noShowProb);
            actualNoShow.add(obs.getObservedNoShowRate());
        }

        // Compute metrics
        Map<String, Object> maMetrics = Map.of(
                "MAE_reservations", calculateMAE(maPredicted, actualRes),
                "RMSE_reservations", calculateRMSE(maPredicted, actualRes),
                "Brier_no_show", calculateBrierScore(maNoShowPred, actualNoShow));
        Map<String, Object> snMetrics = Map.of(
                "MAE_reservations", calculateMAE(snPredicted, actualRes),
                "RMSE_reservations", calculateRMSE(snPredicted, actualRes),
                "Brier_no_show", calculateBrierScore(snNoShowPred, actualNoShow));
        Map<String, Object> emMetrics = Map.of(
                "MAE_reservations", calculateMAE(emPredicted, actualRes),
                "RMSE_reservations", calculateRMSE(emPredicted, actualRes),
                "Brier_no_show", calculateBrierScore(emNoShowPred, actualNoShow));

        // Save forecast runs
        ForecastRun maRun = new ForecastRun();
        maRun.setModelName("baseline_moving_average_4w");
        maRun.setParamsJson("{\"window_weeks\":4,\"target\":\"observed_reservations\"}");
        maRun.setTrainedAt(Instant.now());
        maRun.setTrainStart(trainStart);
        maRun.setTrainEnd(trainEnd);
        maRun.setEvalStart(evalStart);
        maRun.setEvalEnd(evalEnd);
        maRun.setMetricsJson(toJson(maMetrics));
        maRun = runRepo.save(maRun);

        ForecastRun snRun = new ForecastRun();
        snRun.setModelName("baseline_seasonal_naive_isodow");
        snRun.setParamsJson("{\"season\":\"isodow\",\"target\":\"observed_reservations\"}");
        snRun.setTrainedAt(Instant.now());
        snRun.setTrainStart(trainStart);
        snRun.setTrainEnd(trainEnd);
        snRun.setEvalStart(evalStart);
        snRun.setEvalEnd(evalEnd);
        snRun.setMetricsJson(toJson(snMetrics));
        snRun = runRepo.save(snRun);

        ForecastRun emRun = new ForecastRun();
        emRun.setModelName("chosen_ema_weighted_model");
        emRun.setParamsJson("{\"alpha\":0.3,\"features\":[\"isodow\",\"weather_flag\",\"discount_pct\",\"trend\"]}");
        emRun.setTrainedAt(Instant.now());
        emRun.setTrainStart(trainStart);
        emRun.setTrainEnd(trainEnd);
        emRun.setEvalStart(evalStart);
        emRun.setEvalEnd(evalEnd);
        emRun.setMetricsJson(toJson(emMetrics));
        emRun = runRepo.save(emRun);

        // Determine which model won on eval set
        double maMae = calculateMAE(maPredicted, actualRes);
        double snMae = calculateMAE(snPredicted, actualRes);
        double emMae = calculateMAE(emPredicted, actualRes);
        String bestModelName = emMae <= maMae && emMae <= snMae ? "EMA-Weighted"
                : maMae <= snMae ? "Moving Average (4w)" : "Seasonal Naive (ISO DOW)";

        // Generate predictions for active postings
        List<Map<String, Object>> predictions = new ArrayList<>();
        for (BundlePosting posting : postings) {
            List<DemandObservation> postingObs = allObs.stream()
                    .filter(o -> posting.getCategory() != null &&
                            o.getCategory().getCategoryId().equals(posting.getCategory().getCategoryId()) &&
                            posting.getWindow() != null &&
                            o.getWindow().getWindowId().equals(posting.getWindow().getWindowId()))
                    .collect(Collectors.toList());

            if (postingObs.isEmpty()) postingObs = allObs;

            int dow = LocalDate.now().getDayOfWeek().getValue();

            Prediction maPred = movingAverage(postingObs, 4);
            Prediction snPred = seasonalNaive(postingObs, dow);
            Prediction emPred = chosenModel(postingObs, posting);

            // Use the best-performing model for recommendations
            Prediction bestPred = selectBestPrediction(maPred, snPred, emPred,
                    maPredicted, snPredicted, emPredicted, actualRes);

            // Save outputs for chosen model
            ForecastOutput output = new ForecastOutput();
            output.setRun(emRun);
            output.setPosting(posting);
            output.setPredictedReservations(emPred.reservations);
            output.setPredictedNoShowProb(emPred.noShowProb);
            output.setConfidence(emPred.confidence);
            output.setRationaleText(emPred.rationale);
            outputRepo.save(output);

            // Save outputs for baselines too
            ForecastOutput maOutput = new ForecastOutput();
            maOutput.setRun(maRun);
            maOutput.setPosting(posting);
            maOutput.setPredictedReservations(maPred.reservations);
            maOutput.setPredictedNoShowProb(maPred.noShowProb);
            maOutput.setConfidence(maPred.confidence);
            maOutput.setRationaleText(maPred.rationale);
            outputRepo.save(maOutput);

            ForecastOutput snOutput = new ForecastOutput();
            snOutput.setRun(snRun);
            snOutput.setPosting(posting);
            snOutput.setPredictedReservations(snPred.reservations);
            snOutput.setPredictedNoShowProb(snPred.noShowProb);
            snOutput.setConfidence(snPred.confidence);
            snOutput.setRationaleText(snPred.rationale);
            outputRepo.save(snOutput);

            String recommendation = generateRecommendation(posting, bestPred);

            predictions.add(Map.of(
                    "postingId", posting.getPostingId(),
                    "postingTitle", posting.getTitle(),
                    "currentQuantity", posting.getQuantityTotal(),
                    "predictedReservations", bestPred.reservations,
                    "noShowProb", bestPred.noShowProb,
                    "confidence", bestPred.confidence,
                    "rationale", bestPred.rationale,
                    "recommendation", recommendation,
                    "selectedModel", bestModelName
            ));
        }

        return Map.of(
                "predictions", predictions,
                "comparison", List.of(
                        Map.of("modelName", "Moving Average (4w)", "metrics", maMetrics),
                        Map.of("modelName", "Seasonal Naive (ISO DOW)", "metrics", snMetrics),
                        Map.of("modelName", "EMA-Weighted (Chosen)", "metrics", emMetrics)
                ),
                "trainPeriod", Map.of("start", trainStart.toString(), "end", trainEnd.toString()),
                "evalPeriod", Map.of("start", evalStart.toString(), "end", evalEnd.toString())
        );
    }

    private String toJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : map.entrySet()) {
            if (!first) sb.append(",");
            sb.append("\"").append(e.getKey()).append("\":").append(e.getValue());
            first = false;
        }
        sb.append("}");
        return sb.toString();
    }
}
