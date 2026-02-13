"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { bundlesApi } from "@/lib/api/api";

export default function BundlesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bundlesApi.list().then((data) => {
      setBundles(data.content || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = bundles.filter((b) => {
    const title = (b.title || "").toLowerCase();
    const seller = (b.seller?.name || "").toLowerCase();
    const matchSearch = title.includes(search.toLowerCase()) || seller.includes(search.toLowerCase());
    const cat = b.category?.name || "";
    return matchSearch && (category === "All" || cat === category);
  });

  const categories = ["All", ...Array.from(new Set(bundles.map((b) => b.category?.name).filter(Boolean)))];

  const formatPrice = (cents: number) => (cents / 100).toFixed(2);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return <div className="page"><p>Loading bundles...</p></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Browse Bundles</h1>
        <p className="page-subtitle">Save food from going to waste and get great deals</p>
      </div>

      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input" placeholder="Search bundles..." />

      <div className="filters mt-4">
        {categories.map((c) => (
          <button key={c} onClick={() => setCategory(c)} className={`filter-btn ${category === c ? "active" : ""}`}>{c}</button>
        ))}
      </div>

      <div className="grid grid-3 mt-6">
        {filtered.map((b) => {
          const available = b.quantityTotal - b.quantityReserved;
          const discounted = b.discountPct > 0 ? Math.round(b.priceCents * (1 - b.discountPct / 100)) : b.priceCents;
          return (
            <Link key={b.postingId} href={`/bundles/${b.postingId}`} className="bundle-card">
              <div className="bundle-image" />
              <div className="bundle-content">
                <div className="bundle-title">{b.title}</div>
                <div className="bundle-seller">{b.seller?.name}</div>
                <div className="bundle-badges">
                  <span className="badge badge-primary">{available} available</span>
                  {b.discountPct > 0 && <span className="badge badge-warning">{b.discountPct}% off</span>}
                </div>
                <div className="bundle-footer">
                  <div>
                    <span className="bundle-price">${formatPrice(discounted)}</span>
                    {b.discountPct > 0 && <span className="bundle-original-price">${formatPrice(b.priceCents)}</span>}
                  </div>
                  <span className="btn btn-primary btn-sm">View</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="empty-state">No bundles found matching your search.</div>}
    </div>
  );
}
