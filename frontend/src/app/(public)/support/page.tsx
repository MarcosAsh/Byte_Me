"use client";

export default function SupportPage() {
  return (
    <div className="page" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="mb-6">
        <h1 className="page-title">Support</h1>
        <p className="page-subtitle">Need help? Find answers to common questions below.</p>
      </div>

      <div className="card mb-6" style={{ padding: "2rem" }}>
        <h2 className="text-xl font-semibold mb-4">For Organisations</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <details>
            <summary style={{ fontWeight: 500, cursor: "pointer" }}>How do I reserve a bundle?</summary>
            <p className="text-muted" style={{ marginTop: "0.5rem" }}>Browse bundles, select one, and click "Reserve This Bundle". You will receive a claim code to show when you collect.</p>
          </details>
          <details>
            <summary style={{ fontWeight: 500, cursor: "pointer" }}>How do I collect my reservation?</summary>
            <p className="text-muted" style={{ marginTop: "0.5rem" }}>Visit the seller during the pickup window and provide your claim code. The seller will mark your reservation as collected.</p>
          </details>
          <details>
            <summary style={{ fontWeight: 500, cursor: "pointer" }}>How do I report an issue?</summary>
            <p className="text-muted" style={{ marginTop: "0.5rem" }}>If there is a problem with your collection, you can report an issue from your reservations page. The seller will be notified and can respond.</p>
          </details>
        </div>
      </div>

      <div className="card mb-6" style={{ padding: "2rem" }}>
        <h2 className="text-xl font-semibold mb-4">For Sellers</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <details>
            <summary style={{ fontWeight: 500, cursor: "pointer" }}>How do I create a bundle?</summary>
            <p className="text-muted" style={{ marginTop: "0.5rem" }}>Go to your dashboard and click "Create Bundle". Set the title, category, quantity, price, discount, and pickup window.</p>
          </details>
          <details>
            <summary style={{ fontWeight: 500, cursor: "pointer" }}>What is demand forecasting?</summary>
            <p className="text-muted" style={{ marginTop: "0.5rem" }}>Our forecasting system analyses your historical data to predict demand for your bundles, helping you post the right quantities.</p>
          </details>
          <details>
            <summary style={{ fontWeight: 500, cursor: "pointer" }}>How do I respond to issues?</summary>
            <p className="text-muted" style={{ marginTop: "0.5rem" }}>Visit the Issues page from your dashboard. You can respond to reports and mark them as resolved.</p>
          </details>
        </div>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        <h2 className="text-xl font-semibold mb-4">Contact</h2>
        <p>For further assistance, email <strong>support@byteme.test</strong></p>
      </div>
    </div>
  );
}
