"use client";

import Link from "next/link";

export default function OrganizationsPage() {
  return (
    <div className="page" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="mb-6">
        <h1 className="page-title">For Organisations</h1>
        <p className="page-subtitle">Rescue surplus food, reduce waste, and earn rewards.</p>
      </div>

      <div className="card mb-6" style={{ padding: "2rem" }}>
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <h3 style={{ fontWeight: 600 }}>1. Browse Available Bundles</h3>
            <p className="text-muted">Search bundles by name, category, or location. See prices, quantities, and pickup windows at a glance.</p>
          </div>
          <div>
            <h3 style={{ fontWeight: 600 }}>2. Reserve What You Need</h3>
            <p className="text-muted">Reserve bundles instantly. You will receive a unique claim code for each reservation.</p>
          </div>
          <div>
            <h3 style={{ fontWeight: 600 }}>3. Collect During the Pickup Window</h3>
            <p className="text-muted">Visit the seller and show your claim code. The seller marks it as collected and you are done.</p>
          </div>
        </div>
      </div>

      <div className="card mb-6" style={{ padding: "2rem" }}>
        <h2 className="text-xl font-semibold mb-4">Track Your Impact</h2>
        <p style={{ lineHeight: 1.7 }}>
          Every bundle you rescue counts towards your personal impact stats. Track meals rescued,
          CO2 emissions prevented, and maintain weekly collection streaks.
        </p>
      </div>

      <div className="card mb-6" style={{ padding: "2rem" }}>
        <h2 className="text-xl font-semibold mb-4">Earn Badges</h2>
        <p style={{ lineHeight: 1.7 }}>
          Complete achievements like your first rescue, maintaining a 4-week streak,
          rescuing from 3+ different sellers, or collecting from 3+ food categories.
          Badges are awarded automatically as you reach milestones.
        </p>
      </div>

      <div className="text-center">
        <Link href="/register" className="btn btn-primary">Join as an Organisation</Link>
      </div>
    </div>
  );
}
