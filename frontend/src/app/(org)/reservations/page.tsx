"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/store/auth.store";
import { ordersApi } from "@/lib/api/api";

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
  claimCodeLast4?: string;
  collectedAt?: string;
  cancelledAt?: string;
}

type FilterStatus = "ALL" | "RESERVED" | "COLLECTED" | "CANCELLED" | "EXPIRED";

export default function OrgReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<OrgReservation[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const orgId = user?.profileId;
  const token = user?.token;

  const loadData = useCallback(async () => {
    if (!orgId || !token) return;
    setLoading(true);
    setError("");
    try {
      const data = await ordersApi.byOrg(orgId, token);
      setReservations(data);
    } catch {
      setError("Failed to load reservations.");
    } finally {
      setLoading(false);
    }
  }, [orgId, token]);

  useEffect(() => {
    if (!orgId || !token) return;
    loadData();
  }, [orgId, token, loadData]);

  async function handleCancel(id: string) {
    if (!token) return;
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      await ordersApi.cancel(id, token);
      await loadData();
    } catch {
      setError("Failed to cancel reservation.");
    }
  }

  if (!user || user.role !== "ORG_ADMIN") {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <h1 className="text-4xl font-bold mb-4">My Reservations</h1>
          <p className="text-muted">Please log in as an organisation to view reservations.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <p className="text-muted">Loading reservations...</p>
        </div>
      </div>
    );
  }

  const sorted = [...reservations].sort(
    (a, b) => new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime()
  );

  const filtered = filter === "ALL" ? sorted : sorted.filter((r) => r.status === filter);

  const counts: Record<string, number> = { ALL: reservations.length };
  for (const r of reservations) {
    counts[r.status] = (counts[r.status] || 0) + 1;
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">My Reservations</h1>
        <p className="page-subtitle">View and manage your food bundle reservations.</p>
      </div>

      {error && <div className="alert alert-error mb-4" role="alert">{error}</div>}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {(["ALL", "RESERVED", "COLLECTED", "CANCELLED", "EXPIRED"] as FilterStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: filter === s ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
              backgroundColor: filter === s ? "var(--color-primary)" : "transparent",
              color: filter === s ? "white" : "inherit",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            {counts[s] ? ` (${counts[s]})` : ""}
          </button>
        ))}
      </div>

      {/* Reservations list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-muted" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
            {filter === "ALL"
              ? "You haven't made any reservations yet."
              : `No ${filter.toLowerCase()} reservations.`}
          </p>
          {filter === "ALL" && (
            <Link href="/bundles" className="btn btn-primary">
              Browse Bundles
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filtered.map((r) => (
            <ReservationCard key={r.reservationId} reservation={r} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationCard({
  reservation: r,
  onCancel,
}: {
  reservation: {
    reservationId: string;
    postingTitle: string;
    sellerName: string;
    sellerLocation?: string;
    priceCents: number;
    pickupStartAt: string;
    pickupEndAt: string;
    status: string;
    reservedAt: string;
    claimCodeLast4?: string;
    collectedAt?: string;
    cancelledAt?: string;
  };
  onCancel: (id: string) => void;
}) {
  const pickupStart = new Date(r.pickupStartAt);
  const pickupEnd = new Date(r.pickupEndAt);
  const isUpcoming = r.status === "RESERVED" && pickupEnd > new Date();

  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        padding: "1.25rem",
      }}
    >
      {/* Top row: title + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "0.25rem" }}>{r.postingTitle}</h3>
          <p className="text-muted" style={{ fontSize: "0.85rem" }}>
            {r.sellerName}{r.sellerLocation ? ` \u2022 ${r.sellerLocation}` : ""}
          </p>
        </div>
        <StatusBadge status={r.status} />
      </div>

      {/* Details row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", fontSize: "0.9rem" }}>
        <div>
          <span className="text-muted">Price: </span>
          <span style={{ fontWeight: 600 }}>
            {"\u00A3"}{(r.priceCents / 100).toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-muted">Pickup: </span>
          <span>
            {pickupStart.toLocaleDateString()}{" "}
            {pickupStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {" \u2013 "}
            {pickupEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div>
          <span className="text-muted">Reserved: </span>
          <span>{new Date(r.reservedAt).toLocaleDateString()}</span>
        </div>
        {r.collectedAt && (
          <div>
            <span className="text-muted">Collected: </span>
            <span>{new Date(r.collectedAt).toLocaleDateString()}</span>
          </div>
        )}
        {r.cancelledAt && (
          <div>
            <span className="text-muted">Cancelled: </span>
            <span>{new Date(r.cancelledAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Action row for active reservations */}
      {isUpcoming && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid var(--color-border)",
            paddingTop: "0.75rem",
            marginTop: "0.25rem",
          }}
        >
          <div style={{ fontSize: "0.85rem" }}>
            <span className="text-muted">Claim code ends in: </span>
            <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "1rem" }}>
              {r.claimCodeLast4 || "****"}
            </span>
          </div>
          <button
            className="btn btn-secondary"
            style={{ fontSize: "0.8rem", padding: "4px 12px" }}
            onClick={() => onCancel(r.reservationId)}
          >
            Cancel Reservation
          </button>
        </div>
      )}
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
        whiteSpace: "nowrap",
      }}
    >
      {status === "NO_SHOW" ? "No Show" : status}
    </span>
  );
}
