"use client";

import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="page" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="text-center mb-6">
        <h1 className="page-title">Pricing</h1>
        <p className="page-subtitle">Byte Me is free to use for both sellers and organisations.</p>
      </div>

      <div className="card mb-6" style={{ padding: "2rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Free</h2>
        <p style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--success-dark)", marginBottom: "1rem" }}>
          {"\u00A3"}0
        </p>
        <p className="text-muted" style={{ marginBottom: "1.5rem" }}>For all users, forever</p>
        <ul style={{ textAlign: "left", lineHeight: 2, listStyle: "none", padding: 0 }}>
          <li>List unlimited surplus food bundles</li>
          <li>Demand forecasting and analytics</li>
          <li>Reservation and pickup management</li>
          <li>Gamification with badges and streaks</li>
          <li>Issue reporting and resolution</li>
          <li>Environmental impact tracking</li>
        </ul>
      </div>

      <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
        <h3 className="text-xl font-semibold mb-4">Ready to reduce food waste?</h3>
        <Link href="/register" className="btn btn-primary">Create Free Account</Link>
      </div>
    </div>
  );
}
