"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const BUNDLES = [
  { id: "1", title: "Fresh Bakery Bundle", seller: "Corner Bakery", price: 8.99, originalPrice: 24.99, category: "Bakery", items: 5, expires: "2 hours", description: "Assorted fresh bread, pastries, and baked goods from today's batch.", location: "123 Main St", pickupStart: "5:00 PM", pickupEnd: "7:00 PM", allergens: "Wheat, Eggs, Dairy" },
  { id: "2", title: "Organic Veggie Box", seller: "Green Grocer", price: 12.99, originalPrice: 35.00, category: "Produce", items: 8, expires: "1 day", description: "Fresh organic vegetables including carrots, lettuce, tomatoes, and seasonal produce.", location: "456 Oak Ave", pickupStart: "10:00 AM", pickupEnd: "6:00 PM", allergens: "None" },
  { id: "3", title: "Dairy Essentials", seller: "Farm Fresh", price: 6.99, originalPrice: 18.50, category: "Dairy", items: 4, expires: "3 hours", description: "Milk, cheese, yogurt, and butter nearing best-by date but still perfectly good.", location: "789 Farm Rd", pickupStart: "4:00 PM", pickupEnd: "8:00 PM", allergens: "Dairy" },
  { id: "4", title: "Deli Meat Selection", seller: "Main St Deli", price: 15.99, originalPrice: 42.00, category: "Meat", items: 3, expires: "4 hours", description: "Premium sliced meats including turkey, ham, and roast beef.", location: "321 Main St", pickupStart: "3:00 PM", pickupEnd: "6:00 PM", allergens: "None" },
  { id: "5", title: "Ready-to-Eat Meals", seller: "Chef's Kitchen", price: 9.99, originalPrice: 28.00, category: "Prepared", items: 2, expires: "6 hours", description: "Two chef-prepared meals ready to heat and serve.", location: "555 Culinary Blvd", pickupStart: "6:00 PM", pickupEnd: "9:00 PM", allergens: "Varies" },
  { id: "6", title: "Artisan Bread Pack", seller: "Corner Bakery", price: 5.99, originalPrice: 16.00, category: "Bakery", items: 4, expires: "1 hour", description: "Four loaves of artisan bread baked fresh this morning.", location: "123 Main St", pickupStart: "5:00 PM", pickupEnd: "6:00 PM", allergens: "Wheat" },
];

export default function BundleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState(false);

  const bundle = BUNDLES.find((b) => b.id === params.id);

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

  const savings = bundle.originalPrice - bundle.price;
  const savingsPercent = Math.round((savings / bundle.originalPrice) * 100);

  const handleReserve = async () => {
    setReserving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setReserving(false);
    setReserved(true);
  };

  return (
    <div className="page">
      <Link href="/bundles" className="btn btn-secondary mb-4">&larr; Back to Bundles</Link>

      <div className="bundle-detail">
        <div className="bundle-detail-image" />

        <div className="bundle-detail-content">
          <div className="bundle-detail-header">
            <span className="badge badge-primary">{bundle.category}</span>
            <span className="badge badge-warning">Expires in {bundle.expires}</span>
          </div>

          <h1 className="bundle-detail-title">{bundle.title}</h1>
          <p className="bundle-detail-seller">by {bundle.seller}</p>

          <p className="bundle-detail-description">{bundle.description}</p>

          <div className="bundle-detail-pricing">
            <span className="bundle-detail-price">${bundle.price.toFixed(2)}</span>
            <span className="bundle-detail-original">${bundle.originalPrice.toFixed(2)}</span>
            <span className="badge badge-success">Save {savingsPercent}%</span>
          </div>

          <div className="bundle-detail-info">
            <div className="info-row">
              <span className="info-label">Items included</span>
              <span className="info-value">{bundle.items} items</span>
            </div>
            <div className="info-row">
              <span className="info-label">Pickup window</span>
              <span className="info-value">{bundle.pickupStart} - {bundle.pickupEnd}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Location</span>
              <span className="info-value">{bundle.location}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Allergens</span>
              <span className="info-value">{bundle.allergens}</span>
            </div>
          </div>

          {reserved ? (
            <div className="reservation-success">
              <h3>Reserved!</h3>
              <p>Pick up your bundle at {bundle.location} between {bundle.pickupStart} and {bundle.pickupEnd}.</p>
              <Link href="/reservations" className="btn btn-primary mt-4">View My Reservations</Link>
            </div>
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
