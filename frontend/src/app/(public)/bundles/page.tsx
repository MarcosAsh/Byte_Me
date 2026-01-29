"use client";

import Link from "next/link";
import { useState } from "react";

const CATEGORIES = ["All", "Bakery", "Produce", "Dairy", "Meat", "Prepared"];

const BUNDLES = [
  { id: "1", title: "Fresh Bakery Bundle", seller: "Corner Bakery", price: 8.99, originalPrice: 24.99, category: "Bakery", items: 5, expires: "2 hours" },
  { id: "2", title: "Organic Veggie Box", seller: "Green Grocer", price: 12.99, originalPrice: 35.00, category: "Produce", items: 8, expires: "1 day" },
  { id: "3", title: "Dairy Essentials", seller: "Farm Fresh", price: 6.99, originalPrice: 18.50, category: "Dairy", items: 4, expires: "3 hours" },
  { id: "4", title: "Deli Meat Selection", seller: "Main St Deli", price: 15.99, originalPrice: 42.00, category: "Meat", items: 3, expires: "4 hours" },
  { id: "5", title: "Ready-to-Eat Meals", seller: "Chef's Kitchen", price: 9.99, originalPrice: 28.00, category: "Prepared", items: 2, expires: "6 hours" },
  { id: "6", title: "Artisan Bread Pack", seller: "Corner Bakery", price: 5.99, originalPrice: 16.00, category: "Bakery", items: 4, expires: "1 hour" },
];

export default function BundlesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = BUNDLES.filter((b) => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.seller.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (category === "All" || b.category === category);
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Browse Bundles</h1>
        <p className="page-subtitle">Save food from going to waste and get great deals</p>
      </div>

      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input" placeholder="Search bundles..." />

      <div className="filters mt-4">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategory(c)} className={`filter-btn ${category === c ? "active" : ""}`}>{c}</button>
        ))}
      </div>

      <div className="grid grid-3 mt-6">
        {filtered.map((b) => (
          <Link key={b.id} href={`/bundles/${b.id}`} className="bundle-card">
            <div className="bundle-image" />
            <div className="bundle-content">
              <div className="bundle-title">{b.title}</div>
              <div className="bundle-seller">{b.seller}</div>
              <div className="bundle-badges">
                <span className="badge badge-primary">{b.items} items</span>
                <span className="badge badge-warning">{b.expires}</span>
              </div>
              <div className="bundle-footer">
                <div>
                  <span className="bundle-price">${b.price.toFixed(2)}</span>
                  <span className="bundle-original-price">${b.originalPrice.toFixed(2)}</span>
                </div>
                <span className="btn btn-primary btn-sm">View</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && <div className="empty-state">No bundles found matching your search.</div>}
    </div>
  );
}
