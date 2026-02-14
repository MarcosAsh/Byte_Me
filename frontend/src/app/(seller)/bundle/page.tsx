"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth.store";
import { bundlesApi, categoriesApi } from "@/lib/api/api";
import type { Category } from "@/lib/api/types";

interface BundleFormState {
  title: string;
  description: string;
  categoryId: string;
  pickupDate: string;
  pickupStartTime: string;
  pickupEndTime: string;
  quantity: number;
  priceGbp: string;
  discountPct: number;
  allergensText: string;
  activate: boolean;
}

type BundleFormAction =
  | { type: "SET_FIELD"; field: keyof BundleFormState; value: string | number | boolean }
  | { type: "RESET" };

const initialFormState: BundleFormState = {
  title: "",
  description: "",
  categoryId: "",
  pickupDate: "",
  pickupStartTime: "",
  pickupEndTime: "",
  quantity: 1,
  priceGbp: "",
  discountPct: 0,
  allergensText: "",
  activate: true,
};

function formReducer(state: BundleFormState, action: BundleFormAction): BundleFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return initialFormState;
  }
}

export default function CreateBundlePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, dispatch] = useReducer(formReducer, initialFormState);

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {
      setError("Failed to load categories.");
    });
  }, []);

  function setField(field: keyof BundleFormState, value: string | number | boolean) {
    dispatch({ type: "SET_FIELD", field, value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.token) return;

    setError("");
    setSuccess("");

    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.pickupDate || !form.pickupStartTime || !form.pickupEndTime) {
      setError("Pickup date and times are required."); return;
    }
    if (form.quantity < 1) { setError("Quantity must be at least 1."); return; }

    const price = parseFloat(form.priceGbp);
    if (isNaN(price) || price < 0) { setError("Enter a valid price."); return; }

    const pickupStartAt = new Date(`${form.pickupDate}T${form.pickupStartTime}`).toISOString();
    const pickupEndAt = new Date(`${form.pickupDate}T${form.pickupEndTime}`).toISOString();

    if (pickupEndAt <= pickupStartAt) {
      setError("Pickup end time must be after start time."); return;
    }

    setSubmitting(true);
    try {
      await bundlesApi.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        categoryId: form.categoryId || undefined,
        pickupStartAt,
        pickupEndAt,
        quantityTotal: form.quantity,
        priceCents: Math.round(price * 100),
        discountPct: form.discountPct || undefined,
        allergensText: form.allergensText.trim() || undefined,
        activate: form.activate,
      }, user.token);

      setSuccess("Bundle created successfully!");
      dispatch({ type: "RESET" });
    } catch {
      setError("Failed to create bundle. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user || user.role !== "SELLER") {
    return (
      <div className="page">
        <div className="card text-center py-16">
          <h1 className="text-4xl font-bold mb-4">Create Bundle</h1>
          <p className="text-muted">Please log in as a seller to create bundles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: "40rem", margin: "0 auto" }}>
      <div className="mb-6">
        <h1 className="page-title">Create Bundle</h1>
        <p className="page-subtitle">Post surplus food for organisations to reserve.</p>
      </div>

      {error && <div className="alert alert-error mb-4" role="alert">{error}</div>}
      {success && (
        <div className="card mb-4" style={{ backgroundColor: "var(--green-50)", border: "1px solid var(--green-200)", padding: "1rem" }}>
          <p style={{ color: "var(--success-dark)", fontWeight: 500 }}>{success}</p>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button className="btn btn-primary" style={{ fontSize: "0.85rem" }} onClick={() => setSuccess("")}>
              Create Another
            </button>
            <button className="btn btn-secondary" style={{ fontSize: "0.85rem" }} onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label htmlFor="bundle-title" style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem", fontSize: "0.9rem" }}>
              Title *
            </label>
            <input
              id="bundle-title"
              className="input"
              type="text"
              placeholder="e.g. Mixed Bakery Bag"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="bundle-description" style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem", fontSize: "0.9rem" }}>
              Description
            </label>
            <textarea
              id="bundle-description"
              className="input"
              placeholder="What's included? How many items typically?"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
              style={{ resize: "vertical" }}
            />
          </div>

          <div>
            <label htmlFor="bundle-category" style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem", fontSize: "0.9rem" }}>
              Category
            </label>
            <select
              id="bundle-category"
              className="input"
              value={form.categoryId}
              onChange={(e) => setField("categoryId", e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="bundle-date" style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem", fontSize: "0.9rem" }}>
              Pickup Date *
            </label>
            <input
              id="bundle-date"
              className="input"
              type="date"
              value={form.pickupDate}
              onChange={(e) => setField("pickupDate", e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label htmlFor="bundle-start" style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                Pickup Start *
              </label>
              <input
                id="bundle-start"
                className="input"
                type="time"
                value={form.pickupStartTime}
                onChange={(e) => setField("pickupStartTime", e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="bundle-end" style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                Pickup End *
              </label>
              <input
                id="bundle-end"
                className="input"
                type="time"
                value={form.pickupEndTime}
                onChange={(e) => setField("pickupEndTime", e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label htmlFor="bundle-quantity" style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                Quantity *
              </label>
              <input
                id="bundle-quantity"
                className="input"
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setField("quantity", parseInt(e.target.value) || 1)}
                required
              />
            </div>
            <div>
              <label htmlFor="bundle-price" style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                Price (GBP) *
              </label>
              <input
                id="bundle-price"
                className="input"
                type="number"
                step="0.01"
                min="0"
                placeholder="3.50"
                value={form.priceGbp}
                onChange={(e) => setField("priceGbp", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="bundle-discount" style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem", fontSize: "0.9rem" }}>
              Discount (%)
            </label>
            <input
              id="bundle-discount"
              className="input"
              type="number"
              min={0}
              max={100}
              value={form.discountPct}
              onChange={(e) => setField("discountPct", parseInt(e.target.value) || 0)}
            />
            <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
              How much off the original price this bundle represents.
            </p>
          </div>

          <div>
            <label htmlFor="bundle-allergens" style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem", fontSize: "0.9rem" }}>
              Allergen Information
            </label>
            <input
              id="bundle-allergens"
              className="input"
              type="text"
              placeholder="e.g. gluten, dairy, eggs, nuts"
              value={form.allergensText}
              onChange={(e) => setField("allergensText", e.target.value)}
            />
            <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
              List any allergens present in this bundle. This is shown to organisations before they reserve.
            </p>
          </div>

          <label htmlFor="bundle-activate" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input
              id="bundle-activate"
              type="checkbox"
              checked={form.activate}
              onChange={(e) => setField("activate", e.target.checked)}
            />
            <span style={{ fontSize: "0.9rem" }}>Make active immediately</span>
          </label>
          <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "-0.75rem" }}>
            {form.activate ? "Bundle will be visible to organisations right away." : "Bundle will be saved as a draft. You can activate it later."}
          </p>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ marginTop: "0.5rem" }}
          >
            {submitting ? "Creating..." : form.activate ? "Post Bundle" : "Save as Draft"}
          </button>
        </form>
      )}
    </div>
  );
}
