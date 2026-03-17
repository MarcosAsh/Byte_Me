"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/store/auth.store";
import { forecastApi } from "@/lib/api/api";
import type {
  DemandObservationResponse,
  ForecastOutputResponse,
  ForecastRunResponse,
  RecommendationResponse,
} from "@/lib/api/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function SellerAnalyticsPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<DemandObservationResponse[]>([]);
  const [forecasts, setForecasts] = useState<ForecastOutputResponse[]>([]);
  const [runs, setRuns] = useState<ForecastRunResponse[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const sellerId = user?.profileId;
  const token = user?.token;

  const loadData = useCallback(async () => {
    if (!sellerId || !token) return;
    setLoading(true);
    setError("");
    try {
      const [h, f, c, r] = await Promise.all([
        forecastApi.history(sellerId, token),
        forecastApi.results(sellerId, token),
        forecastApi.comparison(sellerId, token),
        forecastApi.recommendations(sellerId, token),
      ]);
      setHistory(h);
      setForecasts(f);
      setRuns(c);
      setRecommendations(r);
    } catch {
      setError("Failed to load forecast data.");
    } finally {
      setLoading(false);
    }
  }, [sellerId, token]);

  useEffect(() => {
    if (!sellerId || !token) return;
    loadData();
  }, [sellerId, token, loadData]);

  async function handleRunForecast() {
    if (!sellerId || !token) return;
    setRunning(true);
    try {
      await forecastApi.run(sellerId, token);
      await loadData();
    } catch {
      setError("Failed to run forecast.");
    } finally {
      setRunning(false);
    }
  }

  // Prepare chart data: group by date, show reservations
  const chartData = [...history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((o) => ({
      date: o.date,
      reservations: o.observedReservations,
      noShowRate: Math.round(o.observedNoShowRate * 100),
      category: o.categoryName,
    }));

  // Parse metrics from JSON string
  function parseMetrics(json: string) {
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  }

  // Group forecasts by model for the chosen model outputs
  const chosenForecasts = forecasts.filter(
    (f) =>
      f.modelName.includes("chosen") ||
      f.modelName.includes("ema") ||
      f.modelName.includes("poisson")
  );

  if (!user || user.role !== "SELLER") {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <h1 className="text-4xl font-bold mb-4">Analytics</h1>
          <p className="text-muted">Please log in as a seller to view analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <p className="text-muted">Loading forecast data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Demand Forecasting</h1>
          <p className="page-subtitle">
            Forecast demand, compare models, and get posting recommendations.
          </p>
          <Link href="/forecast-evaluation" className="btn btn-secondary" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
            View Model Evaluation Report
          </Link>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleRunForecast}
          disabled={running}
        >
          {running ? "Running..." : "Run Forecast"}
        </button>
      </div>

      {error && <div className="alert alert-error mb-4" role="alert">{error}</div>}

      {/* Demand History Chart */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Demand History</h2>
        {chartData.length === 0 ? (
          <p className="text-muted text-center py-8">No historical demand data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="reservations"
                stroke="#16a34a"
                strokeWidth={2}
                name="Reservations"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="noShowRate"
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="No-Show %"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Forecast Predictions */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Forecast Predictions</h2>
        {chosenForecasts.length === 0 ? (
          <p className="text-muted text-center py-8">
            No predictions yet. Click &quot;Run Forecast&quot; to generate.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Posting</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Predicted Reservations</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>No-Show Prob</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {chosenForecasts.map((f) => (
                  <tr key={f.outputId} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "8px 12px" }}>{f.postingTitle}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px", fontWeight: 600 }}>
                      {f.predictedReservations.toFixed(1)}
                    </td>
                    <td style={{ textAlign: "right", padding: "8px 12px", color: f.predictedNoShowProb > 0.15 ? "var(--error-dark)" : "inherit" }}>
                      {(f.predictedNoShowProb * 100).toFixed(0)}%
                    </td>
                    <td style={{ textAlign: "right", padding: "8px 12px" }}>
                      {(f.confidence * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Model Comparison */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Model Comparison</h2>
        {runs.length === 0 ? (
          <p className="text-muted text-center py-8">No model runs available.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Model</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>MAE</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>RMSE</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Brier Score</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Eval Period</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => {
                  const m = parseMetrics(r.metricsJson);
                  const isChosen = r.modelName.includes("chosen") || r.modelName.includes("ema") || r.modelName.includes("poisson");
                  return (
                    <tr
                      key={r.runId}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        backgroundColor: isChosen ? "rgba(22, 163, 74, 0.08)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "8px 12px", fontWeight: isChosen ? 600 : 400 }}>
                        {r.modelName.replace(/_/g, " ")}
                        {isChosen && " *"}
                      </td>
                      <td style={{ textAlign: "right", padding: "8px 12px" }}>
                        {m.MAE_reservations ?? "-"}
                      </td>
                      <td style={{ textAlign: "right", padding: "8px 12px" }}>
                        {m.RMSE_reservations ?? "-"}
                      </td>
                      <td style={{ textAlign: "right", padding: "8px 12px" }}>
                        {m.Brier_no_show ?? "-"}
                      </td>
                      <td style={{ textAlign: "right", padding: "8px 12px", fontSize: "0.85rem", color: "var(--color-muted)" }}>
                        {r.evalStart && r.evalEnd ? `${r.evalStart} to ${r.evalEnd}` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p style={{ fontSize: "0.85rem", color: "var(--color-muted)", marginTop: "8px" }}>
              * Chosen model. Lower MAE/RMSE/Brier = better.
            </p>
          </div>
        )}
      </div>

      {/* Seller Recommendations */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
        {recommendations.length === 0 ? (
          <p className="text-muted text-center py-8">
            No recommendations yet. Click &quot;Run Forecast&quot; to generate.
          </p>
        ) : (
          <div className="grid" style={{ gap: "1rem" }}>
            {recommendations.map((r) => (
              <div key={r.postingId} className="card" style={{ padding: "1rem" }}>
                <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{r.postingTitle}</h3>
                <div style={{ display: "flex", gap: "2rem", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                  <div>
                    <span style={{ color: "var(--color-muted)" }}>Current: </span>
                    <strong>{r.currentQuantity}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-muted)" }}>Recommended: </span>
                    <strong style={{ color: r.recommendedQuantity < r.currentQuantity ? "var(--error-dark)" : "var(--success-dark)" }}>
                      {r.recommendedQuantity}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-muted)" }}>No-show: </span>
                    <strong>{(r.noShowProb * 100).toFixed(0)}%</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-muted)" }}>Confidence: </span>
                    <strong>{(r.confidence * 100).toFixed(0)}%</strong>
                  </div>
                </div>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>{r.recommendation}</p>
                <details style={{ marginTop: "0.5rem" }}>
                  <summary style={{ fontSize: "0.85rem", color: "var(--color-muted)", cursor: "pointer" }}>
                    Model rationale
                  </summary>
                  <p style={{ fontSize: "0.85rem", marginTop: "0.25rem", color: "var(--color-muted)" }}>
                    {r.rationale}
                  </p>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
