package com.byteme.app;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "forecast_run")
public class ForecastRun {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID runId;

    @Column(nullable = false, length = 100)
    private String modelName;

    @Column(columnDefinition = "TEXT")
    private String paramsJson;

    @Column(nullable = false)
    private Instant trainedAt = Instant.now();

    private LocalDate trainStart;
    private LocalDate trainEnd;
    private LocalDate evalStart;
    private LocalDate evalEnd;

    @Column(columnDefinition = "TEXT")
    private String metricsJson;

    public UUID getRunId() { return runId; }
    public String getModelName() { return modelName; }
    public String getParamsJson() { return paramsJson; }
    public Instant getTrainedAt() { return trainedAt; }
    public LocalDate getTrainStart() { return trainStart; }
    public LocalDate getTrainEnd() { return trainEnd; }
    public LocalDate getEvalStart() { return evalStart; }
    public LocalDate getEvalEnd() { return evalEnd; }
    public String getMetricsJson() { return metricsJson; }

    public void setRunId(UUID runId) { this.runId = runId; }
    public void setModelName(String modelName) { this.modelName = modelName; }
    public void setParamsJson(String paramsJson) { this.paramsJson = paramsJson; }
    public void setTrainedAt(Instant trainedAt) { this.trainedAt = trainedAt; }
    public void setTrainStart(LocalDate trainStart) { this.trainStart = trainStart; }
    public void setTrainEnd(LocalDate trainEnd) { this.trainEnd = trainEnd; }
    public void setEvalStart(LocalDate evalStart) { this.evalStart = evalStart; }
    public void setEvalEnd(LocalDate evalEnd) { this.evalEnd = evalEnd; }
    public void setMetricsJson(String metricsJson) { this.metricsJson = metricsJson; }
}
