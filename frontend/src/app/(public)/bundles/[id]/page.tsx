"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { bundlesApi, ordersApi } from "@/lib/api/api";
import { useAuth } from "@/store/auth.store";
import type { BundlePosting } from "@/lib/api/types";
import FoodSafetyDisclaimer from "@/components/FoodSafetyDisclaimer";

export default function BundleDetailPage() {
  const params = useParams();
  const { user, init } = useAuth();
  const [bundle, setBundle] = useState<BundlePosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (!params.id) return;
    bundlesApi.getById(params.id as string)
      .then((data) => { setBundle(data); setLoading(false); })
      .catch(() => { setError("Failed to load bundle."); setLoading(false); });
  }, [params.id]);

  if (loading) {
    return <div className="page"><p>Loading...</p></div>;
  }

  if (!bundle) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>Bundle not found</h2>
          <p>This bundle may no longer be available.</p>
          <Link href="/bundles" className="btn btn-primary mt-4">Browse Bundles</Link>
        </div>
      </div>
    );
  }

  const available = bundle.quantityTotal - bundle.quantityReserved;
  const discountedCents = bundle.discountPct > 0
    ? Math.round(bundle.priceCents * (1 - bundle.discountPct / 100))
    : bundle.priceCents;
  const formatPrice = (cents: number) => (cents / 100).toFixed(2);
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

  const handleReserve = async () => {
    if (!user) return;
    setReserving(true);
    setError(null);
    try {
      const result = await ordersApi.create(
        { postingId: bundle.postingId, orgId: user.profileId },
        user.token
      );
      setReserved(true);
      setClaimCode(result.claimCode || null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reserve bundle");
    } finally {
      setReserving(false);
    }
  };

  const isOrgAdmin = user?.role === "ORG_ADMIN";

  return (
    <div className="page">
      <Link href="/bundles" className="btn btn-secondary mb-4">&larr; Back to Bundles</Link>

      <div className="bundle-detail">
        <div className="bundle-detail-image" />

        <div className="bundle-detail-content">
          <div className="bundle-detail-header">
            {bundle.category && <span className="badge badge-primary">{bundle.category.name}</span>}
            <span className="badge badge-warning">{available} available</span>
          </div>

          <h1 className="bundle-detail-title">{bundle.title}</h1>
          <p className="bundle-detail-seller">by {bundle.seller?.name}</p>

          {bundle.description && <p className="bundle-detail-description">{bundle.description}</p>}

          <div className="bundle-detail-pricing">
            <span className="bundle-detail-price">£{formatPrice(discountedCents)}</span>
            {bundle.discountPct > 0 && (
              <>
                <span className="bundle-detail-original"> | Was £{formatPrice(bundle.priceCents)}</span>
                <span className="badge badge-success">Save {bundle.discountPct}%</span>
              </>
            )}
          </div>

          <div className="bundle-detail-info">
            <div className="info-row">
              <span className="info-label">Pickup Date: </span>
              <span className="info-value">{formatDate(bundle.pickupStartAt)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Pickup Window: </span>
              <span className="info-value">{formatTime(bundle.pickupStartAt)} - {formatTime(bundle.pickupEndAt)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Location: </span>
              <span className="info-value">{bundle.seller?.locationText || "Contact seller"}</span>
            </div>
            {bundle.allergensText && (
              <div className="info-row">
                <span className="info-label">Allergens: </span>
                <span className="info-value">{bundle.allergensText}</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: "1rem" }}>
            <FoodSafetyDisclaimer />
          </div>

          {error && <p className="text-error mt-4" role="alert">{error}</p>}

          {reserved ? (
            <div className="reservation-success">
              <h3>Reserved!</h3>
              {claimCode && <p><strong>Your claim code: {claimCode}</strong></p>}
              <p>Pick up your bundle at {bundle.seller?.locationText} between {formatTime(bundle.pickupStartAt)} and {formatTime(bundle.pickupEndAt)}.</p>
              <Link href="/reservations" className="btn btn-primary mt-4">View My Reservations</Link>
            </div>
          ) : !user ? (
            <Link href="/login" className="btn btn-primary btn-lg mt-6">
              Login to Reserve
            </Link>
          ) : !isOrgAdmin ? (
            <p className="mt-6" style={{color: "var(--muted)"}}>Only organisations can reserve bundles.</p>
          ) : available <= 0 ? (
            <button disabled className="btn btn-secondary btn-lg mt-6">Sold Out</button>
          ) : (
            <button
              onClick={handleReserve}
              disabled={reserving}
              className="btn btn-primary btn-lg mt-6"
            >
              {reserving ? "Reserving..." : "Reserve This Bundle"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
