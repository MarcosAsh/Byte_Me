"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/store/auth.store";
import { forecastApi } from "@/lib/api/api";

interface ModelResult {
  name: string;
  metrics: { mae: number; rmse: number; brierScore: number };
  best: boolean;
}

interface SamplePrediction {
  date: string;
  category: string;
  window: string;
  actual: number;
  movingAvg: number;
  seasonalNaive: number;
  emaWeighted: number;
}

interface EvalResponse {
  models: ModelResult[];
  trainPeriod: { start: string; end: string };
  evalPeriod: { start: string; end: string };
  evalPoints: number;
  samples: SamplePrediction[];
  bestModel: string;
  error?: string;
}

export default function ForecastEvaluationPage() {
  const { user } = useAuth();
  const [data, setData] = useState<EvalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sellerId = user?.profileId;
  const token = user?.token;

  const loadData = useCallback(async () => {
    if (!sellerId || !token) return;
    setLoading(true);
    setError("");
    try {
      const result = await forecastApi.evaluate(sellerId, token);
      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    } catch {
      setError("Failed to load forecast evaluation.");
    } finally {
      setLoading(false);
    }
  }, [sellerId, token]);

  useEffect(() => {
    if (!sellerId || !token) return;
    loadData();
  }, [sellerId, token, loadData]);

  if (!user || user.role !== "SELLER") {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <h1 className="text-4xl font-bold mb-4">Forecast Evaluation</h1>
          <p className="text-muted">Please log in as a seller to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <p className="text-muted">Running model evaluation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Link href="/analytics" className="btn btn-secondary mb-4">&larr; Back to Analytics</Link>

      <div className="mb-6">
        <h1 className="page-title">Forecast Model Evaluation</h1>
        <p className="page-subtitle">
          Comparison of all three forecasting models on held-out evaluation data.
        </p>
      </div>

      {error && <div className="alert alert-error mb-4" role="alert">{error}</div>}

      {data && (
        <>
          {/* Period info */}
          <div className="grid grid-3 mb-6" style={{ gap: "1rem" }}>
            <div className="card" style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
              <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Training Period</p>
              <p style={{ fontWeight: 600 }}>{data.trainPeriod.start} to {data.trainPeriod.end}</p>
            </div>
            <div className="card" style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
              <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Evaluation Period</p>
              <p style={{ fontWeight: 600 }}>{data.evalPeriod.start} to {data.evalPeriod.end}</p>
            </div>
            <div className="card" style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
              <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Eval Data Points</p>
              <p style={{ fontSize: "1.75rem", fontWeight: 700 }}>{data.evalPoints}</p>
            </div>
          </div>

          {/* Best model callout */}
          <div className="card mb-6" style={{ padding: "1rem 1.25rem", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p style={{ fontWeight: 600, color: "#166534" }}>
              Best performing model: {data.bestModel}
            </p>
            <p className="text-muted" style={{ fontSize: "0.85rem" }}>
              Selected based on lowest MAE (Mean Absolute Error) on the held-out evaluation set.
            </p>
          </div>

          {/* Model comparison table */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Model Comparison</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>Model</th>
                    <th style={{ textAlign: "right", padding: "8px 12px" }}>MAE</th>
                    <th style={{ textAlign: "right", padding: "8px 12px" }}>RMSE</th>
                    <th style={{ textAlign: "right", padding: "8px 12px" }}>Brier Score</th>
                    <th style={{ textAlign: "center", padding: "8px 12px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {data.models.map((m) => (
                    <tr key={m.name} style={{
                      borderBottom: "1px solid var(--color-border)",
                      backgroundColor: m.best ? "#f0fdf4" : undefined,
                    }}>
                      <td style={{ padding: "8px 12px", fontWeight: m.best ? 600 : 400 }}>{m.name}</td>
                      <td style={{ textAlign: "right", padding: "8px 12px" }}>{m.metrics.mae.toFixed(2)}</td>
                      <td style={{ textAlign: "right", padding: "8px 12px" }}>{m.metrics.rmse.toFixed(2)}</td>
                      <td style={{ textAlign: "right", padding: "8px 12px" }}>{m.metrics.brierScore.toFixed(3)}</td>
                      <td style={{ textAlign: "center", padding: "8px 12px" }}>
                        {m.best && <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#166534", backgroundColor: "#dcfce7", padding: "2px 8px", borderRadius: "4px" }}>Best</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
              <p><strong>MAE</strong> (Mean Absolute Error): average difference between predicted and actual reservations. Lower is better.</p>
              <p><strong>RMSE</strong> (Root Mean Square Error): penalises large errors more heavily. Lower is better.</p>
              <p><strong>Brier Score</strong>: measures accuracy of no-show probability predictions. Lower is better (0 = perfect).</p>
            </div>
          </div>

          {/* Sample predictions */}
          {data.samples.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">Sample Predictions vs Actual</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px" }}>Date</th>
                      <th style={{ textAlign: "left", padding: "8px 12px" }}>Category</th>
                      <th style={{ textAlign: "left", padding: "8px 12px" }}>Window</th>
                      <th style={{ textAlign: "right", padding: "8px 12px" }}>Actual</th>
                      <th style={{ textAlign: "right", padding: "8px 12px" }}>Moving Avg</th>
                      <th style={{ textAlign: "right", padding: "8px 12px" }}>Seasonal Naive</th>
                      <th style={{ textAlign: "right", padding: "8px 12px" }}>EMA-Weighted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.samples.map((s, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "8px 12px" }}>{s.date}</td>
                        <td style={{ padding: "8px 12px" }}>{s.category}</td>
                        <td style={{ padding: "8px 12px" }}>{s.window}</td>
                        <td style={{ textAlign: "right", padding: "8px 12px", fontWeight: 600 }}>{s.actual}</td>
                        <td style={{ textAlign: "right", padding: "8px 12px" }}>{s.movingAvg}</td>
                        <td style={{ textAlign: "right", padding: "8px 12px" }}>{s.seasonalNaive}</td>
                        <td style={{ textAlign: "right", padding: "8px 12px" }}>{s.emaWeighted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
