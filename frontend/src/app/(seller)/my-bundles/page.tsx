"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/store/auth.store";
import { bundlesApi } from "@/lib/api/api";
import type { BundlePosting, PostingStatus } from "@/lib/api/types";

type FilterStatus = "ALL" | PostingStatus;

export default function SellerBundlesPage() {
  const { user } = useAuth();
  const [bundles, setBundles] = useState<BundlePosting[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sellerId = user?.profileId;
  const token = user?.token;

  const loadData = useCallback(async () => {
    if (!sellerId || !token) return;
    setLoading(true);
    setError("");
    try {
      const data = await bundlesApi.bySeller(sellerId, token);
      setBundles(data);
    } catch {
      setError("Failed to load bundles.");
    } finally {
      setLoading(false);
    }
  }, [sellerId, token]);

  useEffect(() => {
    if (!sellerId || !token) return;
    loadData();
  }, [sellerId, token, loadData]);

  async function handleActivate(id: string) {
    if (!token) return;
    try {
      await bundlesApi.activate(id, token);
      await loadData();
    } catch {
      setError("Failed to activate bundle.");
    }
  }

  async function handleClose(id: string) {
    if (!token) return;
    if (!window.confirm("Close this bundle? It will no longer accept reservations.")) return;
    try {
      await bundlesApi.close(id, token);
      await loadData();
    } catch {
      setError("Failed to close bundle.");
    }
  }

  if (!user || user.role !== "SELLER") {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <h1 className="text-4xl font-bold mb-4">My Bundles</h1>
          <p className="text-muted">Please log in as a seller to manage bundles.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <p className="text-muted">Loading bundles...</p>
        </div>
      </div>
    );
  }

  const sorted = [...bundles].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filtered = filter === "ALL" ? sorted : sorted.filter((b) => b.status === filter);

  const counts: Record<string, number> = { ALL: bundles.length };
  for (const b of bundles) {
    counts[b.status] = (counts[b.status] || 0) + 1;
  }

  return (
    <div className="page">
      <div className="mb-6" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">My Bundles</h1>
          <p className="page-subtitle">Manage your surplus food bundle postings.</p>
        </div>
        <Link href="/bundle" className="btn btn-primary">
          + New Bundle
        </Link>
      </div>

      {error && <div className="alert alert-error mb-4" role="alert">{error}</div>}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {(["ALL", "DRAFT", "ACTIVE", "CLOSED", "CANCELLED"] as FilterStatus[]).map((s) => (
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

      {/* Bundle list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-muted" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
            {filter === "ALL"
              ? "You haven't created any bundles yet."
              : `No ${filter.toLowerCase()} bundles.`}
          </p>
          {filter === "ALL" && (
            <Link href="/bundle" className="btn btn-primary">
              Create Your First Bundle
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filtered.map((b) => (
            <BundleCard
              key={b.postingId}
              bundle={b}
              onActivate={handleActivate}
              onClose={handleClose}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BundleCard({
  bundle: b,
  onActivate,
  onClose,
}: {
  bundle: BundlePosting;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
}) {
  const pickupStart = new Date(b.pickupStartAt);
  const pickupEnd = new Date(b.pickupEndAt);
  const available = b.quantityTotal - b.quantityReserved;

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.75rem" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "0.25rem" }}>{b.title}</h3>
          {b.category && (
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>{b.category.name}</span>
          )}
        </div>
        <StatusBadge status={b.status} />
      </div>

      {b.description && (
        <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>{b.description}</p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
        <div>
          <span className="text-muted">Price: </span>
          <span style={{ fontWeight: 600 }}>
            {"\u00A3"}{(b.priceCents / 100).toFixed(2)}
            {b.discountPct > 0 && (
              <span style={{ color: "var(--success-dark)", marginLeft: "0.25rem", fontSize: "0.8rem" }}>
                ({b.discountPct}% off)
              </span>
            )}
          </span>
        </div>
        <div>
          <span className="text-muted">Qty: </span>
          <span>{b.quantityReserved}/{b.quantityTotal} reserved</span>
          {b.status === "ACTIVE" && (
            <span style={{ color: available > 0 ? "var(--success-dark)" : "var(--error-dark)", marginLeft: "0.25rem", fontSize: "0.8rem" }}>
              ({available} left)
            </span>
          )}
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
      </div>

      {b.allergensText && (
        <p style={{ fontSize: "0.8rem", color: "var(--warning-dark)", marginBottom: "0.75rem" }}>
          Allergens: {b.allergensText}
        </p>
      )}

      {/* Actions */}
      {(b.status === "DRAFT" || b.status === "ACTIVE") && (
        <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem" }}>
          {b.status === "DRAFT" && (
            <button
              className="btn btn-primary"
              style={{ fontSize: "0.8rem", padding: "4px 12px" }}
              onClick={() => onActivate(b.postingId)}
            >
              Activate
            </button>
          )}
          {b.status === "ACTIVE" && (
            <button
              className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "4px 12px" }}
              onClick={() => onClose(b.postingId)}
            >
              Close
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: "var(--gray-100)", text: "var(--gray-600)" },
    ACTIVE: { bg: "var(--status-collected-bg)", text: "var(--status-collected-text)" },
    CLOSED: { bg: "var(--status-expired-bg)", text: "var(--status-expired-text)" },
    CANCELLED: { bg: "var(--status-cancelled-bg)", text: "var(--status-cancelled-text)" },
  };
  const c = colors[status] || colors.CLOSED;
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
      {status}
    </span>
  );
}
