"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/store/auth.store";
import { gamificationApi } from "@/lib/api/api";
import type { StreakResponse, StatsResponse, Badge, OrganisationBadge } from "@/lib/api/types";

export default function OrgGamificationPage() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<OrganisationBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const orgId = user?.profileId;
  const token = user?.token;

  const loadData = useCallback(async () => {
    if (!orgId || !token) return;
    setLoading(true);
    setError("");
    try {
      const [s, st, eb, ab] = await Promise.all([
        gamificationApi.streak(orgId, token),
        gamificationApi.stats(orgId, token),
        gamificationApi.orgBadges(orgId, token),
        gamificationApi.allBadges(),
      ]);
      setStreak(s);
      setStats(st);
      setEarnedBadges(eb);
      setAllBadges(ab);
    } catch {
      setError("Failed to load achievements.");
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
          <h1 className="text-4xl font-bold mb-4">Achievements</h1>
          <p className="text-muted">Please log in as an organisation to view achievements.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <p className="text-muted">Loading achievements...</p>
        </div>
      </div>
    );
  }

  const earnedCodes = new Set(earnedBadges.map((eb) => eb.badge?.code));
  const streakWeeks = streak?.currentStreakWeeks ?? 0;
  const bestWeeks = streak?.bestStreakWeeks ?? 0;

  return (
    <div className="page" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="mb-6">
        <h1 className="page-title">Achievements</h1>
        <p className="page-subtitle">Track your food rescue streak and earn badges.</p>
      </div>

      {error && <div className="alert alert-error mb-4" role="alert">{error}</div>}

      {/* Streak section */}
      <div className="card mb-6" style={{ textAlign: "center", padding: "2rem" }}>
        <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>Current Streak</p>
        <p style={{ fontSize: "3rem", fontWeight: 700, color: streakWeeks >= 4 ? "var(--success-dark)" : "inherit" }}>
          {streakWeeks} {streakWeeks === 1 ? "week" : "weeks"}
        </p>
        <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
          Best streak: {bestWeeks} {bestWeeks === 1 ? "week" : "weeks"}
        </p>

        {/* Streak bar */}
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
            {[1, 2, 3, 4].map((week) => (
              <div
                key={week}
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  backgroundColor: week <= streakWeeks ? "var(--success-dark)" : "var(--gray-200)",
                  color: week <= streakWeeks ? "white" : "var(--gray-500)",
                }}
              >
                W{week}
              </div>
            ))}
          </div>
          <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
            Collect at least once per week to keep your streak going.
          </p>
        </div>
      </div>

      {/* Impact summary */}
      {stats && (
        <div className="card mb-6" style={{ padding: "1.5rem", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#166534" }}>Your Impact</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))", gap: "1rem" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "2rem", fontWeight: 700, color: "#166534" }}>{stats.mealsRescued ?? 0}</p>
              <p className="text-muted" style={{ fontSize: "0.85rem" }}>Meals Rescued</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "2rem", fontWeight: 700, color: "#166534" }}>
                {((stats.co2eSavedGrams ?? 0) / 1000).toFixed(1)} kg
              </p>
              <p className="text-muted" style={{ fontSize: "0.85rem" }}>CO2e Saved</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-3 mb-6" style={{ gap: "1rem" }}>
          <div className="card" style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
            <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Total Rescues</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700 }}>{stats.totalReservations}</p>
          </div>
          <div className="card" style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
            <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Current Streak</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--success-dark)" }}>{stats.currentStreakWeeks}w</p>
          </div>
          <div className="card" style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
            <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Badges Earned</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700 }}>{stats.badgesEarned}</p>
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Badges</h2>
        {allBadges.length === 0 ? (
          <p className="text-muted text-center py-8">No badges available yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(14rem, 1fr))", gap: "1rem" }}>
            {allBadges.map((badge) => {
              const earned = earnedCodes.has(badge.code);
              const awardedAt = earnedBadges.find((eb) => eb.badge?.code === badge.code)?.awardedAt;
              return (
                <div
                  key={badge.badgeId}
                  style={{
                    padding: "1.25rem",
                    borderRadius: "0.75rem",
                    border: earned ? "2px solid var(--success-dark)" : "1px solid var(--gray-200)",
                    backgroundColor: earned ? "var(--green-50)" : "var(--gray-50)",
                    opacity: earned ? 1 : 0.6,
                    textAlign: "center",
                  }}
                >
                  <div style={{
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "50%",
                    margin: "0 auto 0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    backgroundColor: earned ? "var(--success-dark)" : "var(--gray-300)",
                    color: "white",
                  }}>
                    {earned ? "\u2713" : "?"}
                  </div>
                  <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                    {badge.name}
                  </p>
                  <p className="text-muted" style={{ fontSize: "0.8rem" }}>
                    {badge.description}
                  </p>
                  {earned && awardedAt && (
                    <p style={{ fontSize: "0.75rem", color: "var(--success-dark)", marginTop: "0.5rem", fontWeight: 500 }}>
                      Earned {new Date(awardedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
