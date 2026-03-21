import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BundleDetailPage from "@/app/(public)/bundles/[id]/page";
import { bundlesApi, ordersApi } from "@/lib/api/api";
import type { BundlePosting } from "@/lib/api/types";

// ── API mocks ─────────────────────────────────────────────────────────────────
vi.mock("@/lib/api/api", () => ({
  bundlesApi: { getById: vi.fn() },
  ordersApi: { create: vi.fn() },
}));

// ── Auth store helpers ────────────────────────────────────────────────────────
const mockInit = vi.fn();
let mockUser: { profileId: string; role: string; token: string } | null = null;

vi.mock("@/store/auth.store", () => ({
  useAuth: () => ({ user: mockUser, init: mockInit }),
}));

// ── FoodSafetyDisclaimer stub ─────────────────────────────────────────────────
vi.mock("@/components/FoodSafetyDisclaimer", () => ({
  default: () => <p>Food safety disclaimer</p>,
}));

// ── Fixture ───────────────────────────────────────────────────────────────────
const mockBundle: BundlePosting = {
  postingId: "bundle-123",
  title: "Mixed Bakery Bag",
  description: "Assorted fresh pastries",
  priceCents: 500,
  discountPct: 20,
  quantityTotal: 5,
  quantityReserved: 1,
  pickupStartAt: "2026-03-20T09:00:00Z",
  pickupEndAt: "2026-03-20T11:00:00Z",
  status: "ACTIVE",
  createdAt: "2026-03-19T08:00:00Z",
  allergensText: "gluten, dairy",
  seller: { sellerId: "s1", name: "City Bakery", locationText: "123 High St", createdAt: "2026-01-01T00:00:00Z" },
  category: { categoryId: "c1", name: "Bakery" },
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("BundleDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
  });

  // Loading / error states
  it("shows loading indicator initially", () => {
    vi.mocked(bundlesApi.getById).mockReturnValue(new Promise(() => {}));
    render(<BundleDetailPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows not-found message when bundle does not exist", async () => {
    vi.mocked(bundlesApi.getById).mockRejectedValueOnce(new Error("Not found"));
    render(<BundleDetailPage />);
    await waitFor(() =>
      expect(screen.getByText(/bundle not found/i)).toBeInTheDocument()
    );
  });

  // Content rendering
  it("renders bundle title and description", async () => {
    vi.mocked(bundlesApi.getById).mockResolvedValueOnce(mockBundle);
    render(<BundleDetailPage />);
    await waitFor(() => expect(screen.getByText("Mixed Bakery Bag")).toBeInTheDocument());
    expect(screen.getByText("Assorted fresh pastries")).toBeInTheDocument();
  });

  it("renders category badge", async () => {
    vi.mocked(bundlesApi.getById).mockResolvedValueOnce(mockBundle);
    render(<BundleDetailPage />);
    await waitFor(() => expect(screen.getByText("Bakery")).toBeInTheDocument());
  });

  it("renders availability badge", async () => {
    vi.mocked(bundlesApi.getById).mockResolvedValueOnce(mockBundle);
    render(<BundleDetailPage />);
    // 5 - 1 = 4 available
    await waitFor(() => expect(screen.getByText("4 available")).toBeInTheDocument());
  });

  it("renders discounted and original price when discount applies", async () => {
    vi.mocked(bundlesApi.getById).mockResolvedValueOnce(mockBundle);
    render(<BundleDetailPage />);
    await waitFor(() => expect(screen.getByText("£4.00")).toBeInTheDocument());
    expect(screen.getByText(/£5\.00/)).toBeInTheDocument();
    expect(screen.getByText("Save 20%")).toBeInTheDocument();
  });

  it("renders allergen info when present", async () => {
    vi.mocked(bundlesApi.getById).mockResolvedValueOnce(mockBundle);
    render(<BundleDetailPage />);
    await waitFor(() => expect(screen.getByText(/gluten, dairy/i)).toBeInTheDocument());
  });

  it("renders seller name and location", async () => {
    vi.mocked(bundlesApi.getById).mockResolvedValueOnce(mockBundle);
    render(<BundleDetailPage />);
    await waitFor(() => expect(screen.getByText(/city bakery/i)).toBeInTheDocument());
    expect(screen.getByText("123 High St")).toBeInTheDocument();
  });

  it("renders the food safety disclaimer", async () => {
    vi.mocked(bundlesApi.getById).mockResolvedValueOnce(mockBundle);
    render(<BundleDetailPage />);
    await waitFor(() =>
      expect(screen.getByText(/food safety disclaimer/i)).toBeInTheDocument()
    );
  });

  // Auth-gating
  it("shows 'Login to Reserve' button when user is not authenticated", async () => {
    vi.mocked(bundlesApi.getById).mockResolvedValueOnce(mockBundle);
    render(<BundleDetailPage />);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /login to reserve/i })).toBeInTheDocument()
    );
  });

  it("shows a message when user is authenticated but not ORG_ADMIN", async () => {
    mockUser = { profileId: "seller-1", role: "SELLER", token: "tok" };
    vi.mocked(bundlesApi.getById).mockResolvedValueOnce(mockBundle);
    render(<BundleDetailPage />);
    await waitFor(() =>
      expect(screen.getByText(/only organisations can reserve/i)).toBeInTheDocument()
    );
  });

  it("shows 'Sold Out' button when no quantity is available", async () => {
    mockUser = { profileId: "org-1", role: "ORG_ADMIN", token: "tok" };
    const soldOut = { ...mockBundle, quantityReserved: 5 };
    vi.mocked(bundlesApi.getById).mockResolvedValueOnce(soldOut);
    render(<BundleDetailPage />);
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /sold out/i });
      expect(btn).toBeDisabled();
    });
  });

  it("shows 'Reserve This Bundle' button for ORG_ADMIN with stock available", async () => {
    mockUser = { profileId: "org-1", role: "ORG_ADMIN", token: "tok" };
    vi.mocked(bundlesApi.getById).mockResolvedValueOnce(mockBundle);
    render(<BundleDetailPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /reserve this bundle/i })).toBeInTheDocument()
    );
  });

  // Reserve flow
  it("shows 'Reserving...' state while API call is in-flight", async () => {
    mockUser = { profileId: "org-1", role: "ORG_ADMIN", token: "tok" };
    vi.mocked(bundlesApi.getById).mockResolvedValueOnce(mockBundle);
    vi.mocked(ordersApi.create).mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<BundleDetailPage />);
    const btn = await screen.findByRole("button", { name: /reserve this bundle/i });
    await user.click(btn);
    expect(screen.getByRole("button", { name: /reserving/i })).toBeDisabled();
  });

  it("shows reservation success with claim code after successful reserve", async () => {
    mockUser = { profileId: "org-1", role: "ORG_ADMIN", token: "tok" };
    vi.mocked(bundlesApi.getById).mockResolvedValueOnce(mockBundle);
    vi.mocked(ordersApi.create).mockResolvedValueOnce({ claimCode: "ABC123" });
    const user = userEvent.setup();
    render(<BundleDetailPage />);
    const btn = await screen.findByRole("button", { name: /reserve this bundle/i });
    await user.click(btn);
    await waitFor(() => expect(screen.getByText(/reserved!/i)).toBeInTheDocument());
    expect(screen.getByText(/ABC123/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view my reservations/i })).toBeInTheDocument();
  });

  it("shows error alert when reservation API call fails", async () => {
    mockUser = { profileId: "org-1", role: "ORG_ADMIN", token: "tok" };
    vi.mocked(bundlesApi.getById).mockResolvedValueOnce(mockBundle);
    vi.mocked(ordersApi.create).mockRejectedValueOnce(new Error("Reservation failed"));
    const user = userEvent.setup();
    render(<BundleDetailPage />);
    const btn = await screen.findByRole("button", { name: /reserve this bundle/i });
    await user.click(btn);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/reservation failed/i)
    );
  });
});
