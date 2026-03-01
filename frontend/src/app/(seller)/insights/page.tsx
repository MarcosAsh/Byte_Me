"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/store/auth.store";
import { analyticsApi } from "@/lib/api/api";
import type { PricingRow, WindowRow, CategoryRow } from "@/lib/api/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function InsightsPage() {
  const { user } = useAuth();
  const [pricing, setPricing] = useState<PricingRow[]>([]);
  const [windows, setWindows] = useState<WindowRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sellerId = user?.profileId;
  const token = user?.token;

  const loadData = useCallback(async () => {
    if (!sellerId || !token) return;
    setLoading(true);
    setError("");
    try {
      const [p, w, c] = await Promise.all([
        analyticsApi.pricing(sellerId, token),
        analyticsApi.popularWindows(sellerId, token),
        analyticsApi.popularCategories(sellerId, token),
      ]);
      setPricing(p);
      setWindows(w);
      setCategories(c);
    } catch {
      setError("Failed to load insights data.");
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
          <h1 className="text-4xl font-bold mb-4">Insights</h1>
          <p className="text-muted">Please log in as a seller to view insights.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <p className="text-muted">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="mb-6">
        <h1 className="page-title">Insights</h1>
        <p className="page-subtitle">
          Pricing effectiveness, popular pickup windows, and top categories.
        </p>
      </div>

      {error && <div className="alert alert-error mb-4" role="alert">{error}</div>}

      {/* Pricing Effectiveness */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Pricing Effectiveness</h2>
        <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
          Sell-through rate by discount bracket
        </p>
        {pricing.every((r) => r.bundleCount === 0) ? (
          <p className="text-muted text-center py-8">No bundle data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pricing}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bracket" tick={{ fontSize: 12 }} />
              <YAxis unit="%" />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)}%`, "Sell-Through"]}
              />
              <Bar dataKey="sellThroughRate" fill="#16a34a" name="Sell-Through %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {/* Summary table */}
        {pricing.some((r) => r.bundleCount > 0) && (
          <div style={{ overflowX: "auto", marginTop: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Bracket</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Bundles</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Quantity</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Collected</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Sell-Through</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((r) => (
                  <tr key={r.bracket} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "8px 12px" }}>{r.bracket}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px" }}>{r.bundleCount}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px" }}>{r.totalQuantity}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px" }}>{r.collectedCount}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px", fontWeight: 600 }}>
                      {r.sellThroughRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Best Pickup Windows */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Best Pickup Windows</h2>
        <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
          Collection rate by pickup time slot
        </p>
        {windows.length === 0 ? (
          <p className="text-muted text-center py-8">No reservation data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={windows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="windowLabel" tick={{ fontSize: 12 }} />
              <YAxis unit="%" />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)}%`, "Collection Rate"]}
              />
              <Bar dataKey="collectionRate" fill="#2563eb" name="Collection Rate %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {windows.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Window</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Reservations</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Collected</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>No-Shows</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Collection Rate</th>
                </tr>
              </thead>
              <tbody>
                {windows.map((r) => (
                  <tr key={r.windowLabel} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "8px 12px" }}>{r.windowLabel}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px" }}>{r.totalReservations}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px" }}>{r.collectedCount}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px" }}>{r.noShowCount}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px", fontWeight: 600 }}>
                      {r.collectionRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Most Popular Categories */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Most Popular Categories</h2>
        <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
          Sell-through rate by food category
        </p>
        {categories.length === 0 ? (
          <p className="text-muted text-center py-8">No bundle data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categories}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoryName" tick={{ fontSize: 12 }} />
              <YAxis unit="%" />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)}%`, "Sell-Through"]}
              />
              <Bar dataKey="sellThroughRate" fill="#d97706" name="Sell-Through %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {categories.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Category</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Bundles</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Quantity</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Collected</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Sell-Through</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((r) => (
                  <tr key={r.categoryName} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "8px 12px" }}>{r.categoryName}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px" }}>{r.bundlesPosted}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px" }}>{r.totalQuantity}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px" }}>{r.collectedCount}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px", fontWeight: 600 }}>
                      {r.sellThroughRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
