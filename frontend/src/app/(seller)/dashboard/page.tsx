"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/store/auth.store";
import { analyticsApi, ordersApi, issuesApi } from "@/lib/api/api";
import type { DashboardResponse, IssueReport, WasteAvoidedResponse, SellThroughResponse } from "@/lib/api/types";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface SellerOrder {
  reservationId: string;
  postingTitle: string;
  organisationName: string;
  status: string;
  reservedAt: string;
  collectedAt?: string;
  cancelledAt?: string;
}

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [waste, setWaste] = useState<WasteAvoidedResponse | null>(null);
  const [sellThrough, setSellThrough] = useState<SellThroughResponse | null>(null);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sellerId = user?.profileId;
  const token = user?.token;

  const loadData = useCallback(async () => {
    if (!sellerId || !token) return;
    setLoading(true);
    setError("");
    try {
      const [d, o, i, w] = await Promise.all([
        analyticsApi.dashboard(sellerId, token),
        ordersApi.bySeller(sellerId, token),
        issuesApi.openBySeller(sellerId, token),
        analyticsApi.wasteAvoided(sellerId, token),
      ]);
      setDashboard(d);
      setOrders(o);
      setIssues(i);
      setWaste(w);
      // Load sell-through separately so it doesn't block the dashboard
      try {
        const st = await analyticsApi.sellThrough(sellerId, token);
        setSellThrough(st);
      } catch {
        // Non-critical, dashboard still works without the chart
      }
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [sellerId, token]);

  useEffect(() => {
    if (!sellerId || !token) return;
    loadData();
  }, [sellerId, token, loadData]);

  async function handleCollect(id: string) {
    if (!token) return;
    const claimCode = window.prompt("Enter the 6-digit claim code shown by the organisation:");
    if (!claimCode) return;
    try {
      await ordersApi.collect(id, claimCode, token);
      await loadData();
    } catch {
      setError("Invalid claim code or failed to collect order.");
    }
  }

  async function handleCancel(id: string) {
    if (!token) return;
    try {
      await ordersApi.cancel(id, token);
      await loadData();
    } catch {
      setError("Failed to cancel order.");
    }
  }

  if (!user || user.role !== "SELLER") {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
          <p className="text-muted">Please log in as a seller to view your dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime())
    .slice(0, 10);

  return (
    <div className="page">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          {dashboard?.sellerName ? `Welcome back, ${dashboard.sellerName}` : "Your selling overview"}
        </p>
      </div>

      {error && <div className="alert alert-error mb-4" role="alert">{error}</div>}

      {/* Stats grid */}
      {dashboard && (
        <div className="grid grid-3 mb-6" style={{ gap: "1rem" }}>
          <StatCard label="Bundles Posted" value={dashboard.totalBundlesPosted} />
          <StatCard
            label="Sell-Through Rate"
            value={`${dashboard.sellThroughRate.toFixed(0)}%`}
            color={dashboard.sellThroughRate >= 70 ? "var(--success-dark)" : dashboard.sellThroughRate >= 40 ? "var(--warning-dark)" : "var(--error-dark)"}
          />
          <StatCard label="Collected" value={dashboard.collectedCount} color="var(--success-dark)" />
          <StatCard label="Cancelled" value={dashboard.cancelledCount} color={dashboard.cancelledCount > 0 ? "var(--error-dark)" : undefined} />
          <StatCard label="Expired" value={dashboard.expiredCount} color={dashboard.expiredCount > 0 ? "var(--warning-dark)" : undefined} />
          <StatCard
            label="Open Issues"
            value={dashboard.openIssueCount}
            color={dashboard.openIssueCount > 0 ? "var(--error-dark)" : "var(--success-dark)"}
          />
        </div>
      )}

      {/* Sell-through breakdown chart */}
      {sellThrough && (sellThrough.collected + sellThrough.cancelled + sellThrough.expired) > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Sell-Through Breakdown</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
            <ResponsiveContainer width="100%" height={260} minWidth={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Collected", value: sellThrough.collected },
                    { name: "Cancelled", value: sellThrough.cancelled },
                    { name: "Expired", value: sellThrough.expired },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  <Cell fill="#16a34a" />
                  <Cell fill="#dc2626" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
            Collection rate: {sellThrough.collectionRate.toFixed(1)}%
          </p>
        </div>
      )}

      {/* Waste avoided */}
      {waste && waste.totalBundlesCollected > 0 && (
        <div className="card mb-6" style={{ padding: "1.5rem", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#166534" }}>Waste Avoided</h2>
          <div className="grid grid-3" style={{ gap: "1rem" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#166534" }}>{waste.wasteAvoidedKg} kg</p>
              <p className="text-muted" style={{ fontSize: "0.85rem" }}>Food Waste Avoided</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#166534" }}>{waste.co2eAvoidedKg} kg</p>
              <p className="text-muted" style={{ fontSize: "0.85rem" }}>CO2e Avoided</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#166534" }}>{waste.avgWeightPerBundleKg} kg</p>
              <p className="text-muted" style={{ fontSize: "0.85rem" }}>Avg Bundle Weight</p>
            </div>
          </div>
          <p className="text-muted" style={{ fontSize: "0.75rem", marginTop: "0.75rem" }}>
            Based on {waste.totalBundlesCollected} collected bundles. Default 1.5 kg assumed where weight not specified.
            CO2e estimate uses 2.5 kg CO2e per kg food waste (WRAP UK).
          </p>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-3 mb-6" style={{ gap: "1rem" }}>
        <Link href="/analytics" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Demand Forecasting</h3>
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>View predictions, model comparisons, and recommendations</p>
        </Link>
        <Link href="/bundle" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Create Bundle</h3>
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>Post a new surplus food bundle for organisations</p>
        </Link>
        <Link href="/insights" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Insights</h3>
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>Pricing effectiveness, pickup windows, and popular categories</p>
        </Link>
        <Link href="/issues" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Issues</h3>
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>View and respond to reports from organisations</p>
        </Link>
      </div>

      {/* Recent orders */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-muted text-center py-8">No orders yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Bundle</th>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Organisation</th>
                  <th style={{ textAlign: "center", padding: "8px 12px" }}>Status</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Reserved</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.reservationId} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "8px 12px" }}>{order.postingTitle}</td>
                    <td style={{ padding: "8px 12px" }}>{order.organisationName}</td>
                    <td style={{ textAlign: "center", padding: "8px 12px" }}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ textAlign: "right", padding: "8px 12px", fontSize: "0.85rem", color: "var(--color-muted)" }}>
                      {new Date(order.reservedAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: "right", padding: "8px 12px" }}>
                      {order.status === "RESERVED" && (
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                            onClick={() => handleCollect(order.reservationId)}
                          >
                            Mark Collected
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                            onClick={() => handleCancel(order.reservationId)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Open issues */}
      {issues.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Open Issues ({issues.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {issues.map((issue) => (
              <div
                key={issue.issueId}
                style={{
                  padding: "0.75rem 1rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        backgroundColor: issue.type === "QUALITY" ? "var(--status-cancelled-bg)" : issue.type === "UNAVAILABLE" ? "#fff7ed" : "#f0f9ff",
                        color: issue.type === "QUALITY" ? "var(--error-dark)" : issue.type === "UNAVAILABLE" ? "var(--orange)" : "var(--info-dark)",
                      }}
                    >
                      {issue.type}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.9rem" }}>{issue.description}</p>
                </div>
                <Link
                  href="/issues"
                  className="btn btn-secondary"
                  style={{ fontSize: "0.75rem", padding: "4px 10px", whiteSpace: "nowrap" }}
                >
                  Respond
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
      <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>{label}</p>
      <p style={{ fontSize: "1.75rem", fontWeight: 700, color: color || "inherit" }}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    RESERVED: { bg: "var(--status-reserved-bg)", text: "var(--status-reserved-text)" },
    COLLECTED: { bg: "var(--status-collected-bg)", text: "var(--status-collected-text)" },
    CANCELLED: { bg: "var(--status-cancelled-bg)", text: "var(--status-cancelled-text)" },
    EXPIRED: { bg: "var(--status-expired-bg)", text: "var(--status-expired-text)" },
  };
  const c = colors[status] || colors.EXPIRED;
  return (
    <span
      style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "4px",
        backgroundColor: c.bg,
        color: c.text,
      }}
    >
      {status}
    </span>
  );
}
