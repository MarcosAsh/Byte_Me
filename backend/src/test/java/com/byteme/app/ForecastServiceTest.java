package com.byteme.app;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ForecastServiceTest {

    // --- Moving Average tests ---

    @Test
    void movingAverageReturnsZeroForEmptyList() {
        ForecastService service = createService();
        var pred = service.movingAverage(List.of(), 4);
        assertEquals(0, pred.reservations);
        assertEquals(0, pred.noShowProb);
    }

    @Test
    void movingAverageComputesMeanOfReservations() {
        ForecastService service = createService();
        List<DemandObservation> obs = List.of(
                makeObs(LocalDate.now().minusDays(3), 10, 0.10),
                makeObs(LocalDate.now().minusDays(2), 20, 0.20),
                makeObs(LocalDate.now().minusDays(1), 30, 0.30)
        );
        var pred = service.movingAverage(obs, 4);
        assertEquals(20.0, pred.reservations, 0.1);
        assertEquals(0.20, pred.noShowProb, 0.01);
    }

    @Test
    void movingAverageLimitsToWindowSize() {
        ForecastService service = createService();
        List<DemandObservation> obs = List.of(
                makeObs(LocalDate.now().minusDays(5), 100, 0.50),
                makeObs(LocalDate.now().minusDays(4), 100, 0.50),
                makeObs(LocalDate.now().minusDays(3), 100, 0.50),
                makeObs(LocalDate.now().minusDays(2), 10, 0.10),
                makeObs(LocalDate.now().minusDays(1), 10, 0.10)
        );
        // Window of 2 should only use the 2 most recent (both 10)
        var pred = service.movingAverage(obs, 2);
        assertEquals(10.0, pred.reservations, 0.1);
    }

    // --- Seasonal Naive tests ---

    @Test
    void seasonalNaiveReturnsZeroForEmptyList() {
        ForecastService service = createService();
        var pred = service.seasonalNaive(List.of(), 1);
        assertEquals(0, pred.reservations);
    }

    @Test
    void seasonalNaiveMatchesDayOfWeek() {
        ForecastService service = createService();
        // Create obs on a Monday (dow=1) and Tuesday (dow=2)
        DemandObservation monday = makeObs(LocalDate.of(2026, 3, 16), 15, 0.12); // Monday
        monday.setDayOfWeek(1);
        DemandObservation tuesday = makeObs(LocalDate.of(2026, 3, 17), 25, 0.22); // Tuesday
        tuesday.setDayOfWeek(2);

        var pred = service.seasonalNaive(List.of(monday, tuesday), 2);
        assertEquals(25, pred.reservations);
        assertEquals(0.22, pred.noShowProb, 0.01);
    }

    @Test
    void seasonalNaiveFallsBackToLatest() {
        ForecastService service = createService();
        DemandObservation obs = makeObs(LocalDate.of(2026, 3, 16), 15, 0.12);
        obs.setDayOfWeek(1);

        // Ask for day 5 (Friday) which doesn't exist
        var pred = service.seasonalNaive(List.of(obs), 5);
        assertEquals(15, pred.reservations);
        assertTrue(pred.confidence < 0.5); // lower confidence for fallback
    }

    // --- Error Metric tests ---

    @Test
    void maeCalculatesCorrectly() {
        double mae = ForecastService.calculateMAE(
                List.of(10.0, 20.0, 30.0),
                List.of(12, 18, 25)
        );
        // |10-12| + |20-18| + |30-25| = 2+2+5 = 9, 9/3 = 3.0
        assertEquals(3.0, mae, 0.01);
    }

    @Test
    void maeReturnsZeroForEmpty() {
        assertEquals(0, ForecastService.calculateMAE(List.of(), List.of()));
    }

    @Test
    void rmseCalculatesCorrectly() {
        double rmse = ForecastService.calculateRMSE(
                List.of(10.0, 20.0),
                List.of(12, 18)
        );
        // (10-12)^2 + (20-18)^2 = 4+4 = 8, sqrt(8/2) = 2.0
        assertEquals(2.0, rmse, 0.01);
    }

    @Test
    void rmseReturnsZeroForEmpty() {
        assertEquals(0, ForecastService.calculateRMSE(List.of(), List.of()));
    }

    @Test
    void brierScoreCalculatesCorrectly() {
        double brier = ForecastService.calculateBrierScore(
                List.of(0.2, 0.8),
                List.of(0.0, 1.0)
        );
        // (0.2-0)^2 + (0.8-1)^2 = 0.04+0.04 = 0.08, 0.08/2 = 0.04
        assertEquals(0.04, brier, 0.001);
    }

    // --- Chosen Model tests ---

    @Test
    void chosenModelReturnsZeroForEmptyList() {
        ForecastService service = createService();
        BundlePosting posting = new BundlePosting();
        posting.setDiscountPct(10);
        posting.setQuantityTotal(5);
        var pred = service.chosenModel(List.of(), posting);
        assertEquals(0, pred.reservations);
    }

    @Test
    void chosenModelProducesPositivePrediction() {
        ForecastService service = createService();
        List<DemandObservation> obs = new ArrayList<>();
        for (int i = 10; i >= 1; i--) {
            obs.add(makeObs(LocalDate.now().minusDays(i), 10 + i, 0.1));
        }
        BundlePosting posting = new BundlePosting();
        posting.setDiscountPct(20);
        posting.setQuantityTotal(15);
        var pred = service.chosenModel(obs, posting);
        assertTrue(pred.reservations > 0);
        assertTrue(pred.noShowProb >= 0 && pred.noShowProb <= 1);
        assertTrue(pred.confidence > 0);
    }

    // --- Recommendation tests ---

    @Test
    void recommendationSuggestsReductionWhenOverposting() {
        ForecastService service = createService();
        BundlePosting posting = new BundlePosting();
        posting.setQuantityTotal(50);
        posting.setTitle("Test Bundle");

        ForecastService.Prediction pred = new ForecastService.Prediction(10, 0.1, 0.7, "test");
        String rec = service.generateRecommendation(posting, pred);
        assertTrue(rec.contains("instead of 50"));
    }

    @Test
    void recommendationSuggestsIncreaseWhenUnderposting() {
        ForecastService service = createService();
        BundlePosting posting = new BundlePosting();
        posting.setQuantityTotal(3);
        posting.setTitle("Test Bundle");

        ForecastService.Prediction pred = new ForecastService.Prediction(20, 0.1, 0.7, "test");
        String rec = service.generateRecommendation(posting, pred);
        assertTrue(rec.contains("exceeds current quantity"));
    }

    @Test
    void recommendationWarnsAboutHighNoShow() {
        ForecastService service = createService();
        BundlePosting posting = new BundlePosting();
        posting.setQuantityTotal(10);
        posting.setTitle("Test Bundle");

        ForecastService.Prediction pred = new ForecastService.Prediction(10, 0.25, 0.7, "test");
        String rec = service.generateRecommendation(posting, pred);
        assertTrue(rec.contains("No-show risk"));
    }

    // --- Helper methods ---

    private ForecastService createService() {
        return new ForecastService(null, null, null, null);
    }

    private DemandObservation makeObs(LocalDate date, int reservations, double noShowRate) {
        DemandObservation obs = new DemandObservation();
        obs.setDate(date);
        obs.setDayOfWeek(date.getDayOfWeek().getValue());
        obs.setObservedReservations(reservations);
        obs.setObservedNoShowRate(noShowRate);
        obs.setDiscountPct(10);
        obs.setWeatherFlag(false);
        return obs;
    }
}
