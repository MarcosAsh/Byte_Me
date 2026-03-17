"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/store/auth.store";
import { ordersApi, gamificationApi, issuesApi } from "@/lib/api/api";
import type { StatsResponse, StreakResponse } from "@/lib/api/types";

interface OrgReservation {
  reservationId: string;
  postingTitle: string;
  sellerName: string;
  sellerLocation?: string;
  priceCents: number;
  pickupStartAt: string;
  pickupEndAt: string;
  status: string;
  reservedAt: string;
  collectedAt?: string;
  cancelledAt?: string;
}

interface OrgIssue {
  issueId: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function OrgDashboardPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<OrgReservation[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [issues, setIssues] = useState<OrgIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const orgId = user?.profileId;
  const token = user?.token;

  const loadData = useCallback(async () => {
    if (!orgId || !token) return;
    setLoading(true);
    setError("");
    try {
      const [r, st, sk, iss] = await Promise.all([
        ordersApi.byOrg(orgId, token),
        gamificationApi.stats(orgId, token),
        gamificationApi.streak(orgId, token),
        issuesApi.byOrg(orgId, token),
      ]);
      setReservations(r);
      setStats(st);
      setStreak(sk);
      setIssues(iss);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [orgId, token]);

  useEffect(() => {
    if (!orgId || !token) return;
    loadData();
  }, [orgId, token, loadData]);

  if (!user || user.role !== "ORG_ADMIN") {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
          <p className="text-muted">Please log in as an organisation to view your dashboard.</p>
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

  const collectedCount = reservations.filter((r) => r.status === "COLLECTED").length;
  const cancelledCount = reservations.filter((r) => r.status === "CANCELLED").length;
  const expiredCount = reservations.filter((r) => r.status === "EXPIRED").length;
  const activeCount = reservations.filter((r) => r.status === "RESERVED").length;
  const openIssueCount = issues.filter((i) => i.status === "OPEN").length;

  const totalFinished = collectedCount + cancelledCount + expiredCount;
  const collectionRate = totalFinished > 0 ? Math.round((collectedCount / totalFinished) * 100) : 0;

  const recentOrders = [...reservations]
    .sort((a, b) => new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime())
    .slice(0, 8);

  return (
    <div className="page">
      <div className="mb-6">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Your food rescue overview at a glance.</p>
      </div>

      {error && <div className="alert alert-error mb-4" role="alert">{error}</div>}

      {/* Stats grid */}
      <div className="grid grid-3 mb-6" style={{ gap: "1rem" }}>
        <StatCard label="Total Rescues" value={stats?.totalReservations ?? 0} />
        <StatCard
          label="Collection Rate"
          value={`${collectionRate}%`}
          color={collectionRate >= 70 ? "var(--success-dark)" : collectionRate >= 40 ? "var(--warning-dark)" : "var(--error-dark)"}
        />
        <StatCard
          label="Current Streak"
          value={`${streak?.currentStreakWeeks ?? 0}w`}
          color="var(--success-dark)"
        />
        <StatCard label="Active" value={activeCount} color={activeCount > 0 ? "var(--info-dark)" : undefined} />
        <StatCard label="Collected" value={collectedCount} color="var(--success-dark)" />
        <StatCard
          label="Open Issues"
          value={openIssueCount}
          color={openIssueCount > 0 ? "var(--error-dark)" : "var(--success-dark)"}
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-3 mb-6" style={{ gap: "1rem" }}>
        <Link href="/bundles" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Browse Bundles</h3>
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>Find and reserve surplus food bundles</p>
        </Link>
        <Link href="/reservations" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Reservations</h3>
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>View and manage your current reservations</p>
        </Link>
        <Link href="/gamification" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Achievements</h3>
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>Track your streak and earned badges</p>
        </Link>
      </div>

      {/* Recent orders */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Recent Reservations</h2>
        {recentOrders.length === 0 ? (
          <p className="text-muted text-center py-8">No reservations yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Bundle</th>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Seller</th>
                  <th style={{ textAlign: "center", padding: "8px 12px" }}>Status</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Price</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Reserved</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.reservationId} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "8px 12px" }}>{order.postingTitle}</td>
                    <td style={{ padding: "8px 12px" }}>{order.sellerName}</td>
                    <td style={{ textAlign: "center", padding: "8px 12px" }}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ textAlign: "right", padding: "8px 12px", fontWeight: 600 }}>
                      {"\u00A3"}{(order.priceCents / 100).toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right", padding: "8px 12px", fontSize: "0.85rem", color: "var(--color-muted)" }}>
                      {new Date(order.reservedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {reservations.length > 8 && (
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link href="/reservations" className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              View All Reservations
            </Link>
          </div>
        )}
      </div>
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
    NO_SHOW: { bg: "var(--status-expired-bg)", text: "var(--status-expired-text)" },
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
      {status === "NO_SHOW" ? "No Show" : status}
    </span>
  );
}
