"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="page" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="text-center mb-6">
        <h1 className="page-title">About Byte Me</h1>
        <p className="page-subtitle">Connecting surplus food with people who need it.</p>
      </div>

      <div className="card mb-6" style={{ padding: "2rem" }}>
        <p style={{ lineHeight: 1.7 }}>
          Byte Me is a food rescue platform that helps sellers redistribute surplus food
          to charitable organisations. Sellers list discounted bundles, organisations
          reserve and collect them, and together we reduce food waste.
        </p>
      </div>

      <div className="text-center">
        <Link href="/register" className="btn btn-primary">Get Started</Link>
      </div>
    </div>
  );
}
