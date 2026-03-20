"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/store/auth.store";
import { gamificationApi } from "@/lib/api/api";
import type { StatsResponse, StreakResponse } from "@/lib/api/types";

export default function ImpactPage() {
  const { user, init } = useAuth();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { init(); }, [init]);

  const orgId = user?.role === "ORG_ADMIN" ? user.profileId : null;
  const token = user?.token;

  const loadStats = useCallback(async () => {
    if (!orgId || !token) return;
    setLoading(true);
    try {
      const [s, st] = await Promise.all([
        gamificationApi.stats(orgId, token),
        gamificationApi.streak(orgId, token),
      ]);
      setStats(s);
      setStreak(st);
    } catch {
      // silently fail for public page
    } finally {
      setLoading(false);
    }
  }, [orgId, token]);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <div className="page" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="text-center mb-6">
        <h1 className="page-title" style={{ color: "var(--success-dark)" }}>Our Impact</h1>
        <p className="page-subtitle">Every bundle rescued means less waste and fewer emissions.</p>
      </div>

      {/* Personal stats (org logged in) */}
      {orgId && stats && !loading && (
        <div className="card mb-6" style={{ padding: "2rem", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#166534", textAlign: "center" }}>
            Your Impact
          </h2>
          <div className="grid grid-3" style={{ gap: "1rem" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "2rem", fontWeight: 700, color: "#166534" }}>{stats.mealsRescued}</p>
              <p className="text-muted">Meals Rescued</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "2rem", fontWeight: 700, color: "#166534" }}>
                {((stats.co2eSavedGrams) / 1000).toFixed(1)} kg
              </p>
              <p className="text-muted">CO2e Saved</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "2rem", fontWeight: 700, color: "#166534" }}>
                {streak?.currentStreakWeeks ?? 0}
              </p>
              <p className="text-muted">Week Streak</p>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link href="/gamification" className="btn btn-primary">View Achievements</Link>
          </div>
        </div>
      )}

      {loading && orgId && (
        <div className="card mb-6 text-center" style={{ padding: "2rem" }}>
          <p className="text-muted">Loading your stats...</p>
        </div>
      )}

      <div className="card mb-6" style={{ padding: "2rem" }}>
        <p style={{ lineHeight: 1.7 }}>
          Food waste is a major contributor to climate change. In the UK alone, around 9.5 million
          tonnes of food is wasted each year. Every kilogram of food diverted from landfill avoids
          roughly 2.5 kg of CO2 equivalent emissions.
        </p>
        <p style={{ lineHeight: 1.7, marginTop: "1rem" }}>
          Byte Me helps by connecting sellers with organisations to rescue surplus food before
          it goes to waste.
        </p>
      </div>

      {!user && (
        <div className="text-center">
          <Link href="/register" className="btn btn-primary">Join and Make an Impact</Link>
        </div>
      )}
    </div>
  );
}
