package com.byteme.app;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "forecast_output")
public class ForecastOutput {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID outputId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "run_id", nullable = false)
    private ForecastRun run;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "posting_id", nullable = false)
    private BundlePosting posting;

    @Column(nullable = false)
    private double predictedReservations;

    @Column(nullable = false)
    private double predictedNoShowProb;

    @Column(nullable = false)
    private double confidence;

    @Column(columnDefinition = "TEXT")
    private String rationaleText;

    public UUID getOutputId() { return outputId; }
    public ForecastRun getRun() { return run; }
    public BundlePosting getPosting() { return posting; }
    public double getPredictedReservations() { return predictedReservations; }
    public double getPredictedNoShowProb() { return predictedNoShowProb; }
    public double getConfidence() { return confidence; }
    public String getRationaleText() { return rationaleText; }

    public void setOutputId(UUID outputId) { this.outputId = outputId; }
    public void setRun(ForecastRun run) { this.run = run; }
    public void setPosting(BundlePosting posting) { this.posting = posting; }
    public void setPredictedReservations(double predictedReservations) { this.predictedReservations = predictedReservations; }
    public void setPredictedNoShowProb(double predictedNoShowProb) { this.predictedNoShowProb = predictedNoShowProb; }
    public void setConfidence(double confidence) { this.confidence = confidence; }
    public void setRationaleText(String rationaleText) { this.rationaleText = rationaleText; }
}
