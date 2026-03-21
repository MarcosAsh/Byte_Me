import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SellerBundlesPage from "@/app/(seller)/my-bundles/page";
import { bundlesApi } from "@/lib/api/api";
import type { BundlePosting } from "@/lib/api/types";

// ── API mock ──────────────────────────────────────────────────────────────────
vi.mock("@/lib/api/api", () => ({
  bundlesApi: {
    bySeller: vi.fn(),
    activate: vi.fn(),
    close: vi.fn(),
  },
}));

// ── Auth store helpers ────────────────────────────────────────────────────────
let mockUser: { profileId: string; role: string; token: string } | null = null;

vi.mock("@/store/auth.store", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const draft: BundlePosting = {
  postingId: "p1",
  title: "Draft Bundle",
  description: "",
  priceCents: 300,
  discountPct: 0,
  quantityTotal: 4,
  quantityReserved: 0,
  pickupStartAt: "2026-04-01T09:00:00Z",
  pickupEndAt: "2026-04-01T11:00:00Z",
  status: "DRAFT",
  createdAt: "2026-03-01T08:00:00Z",
  seller: { sellerId: "s1", name: "Seller Co", locationText: "1 Main St", createdAt: "2026-01-01T00:00:00Z" },
  category: { categoryId: "c1", name: "Bakery" },
};

const active: BundlePosting = {
  ...draft,
  postingId: "p2",
  title: "Active Bundle",
  status: "ACTIVE",
  quantityReserved: 2,
};

const closed: BundlePosting = {
  ...draft,
  postingId: "p3",
  title: "Closed Bundle",
  status: "CLOSED",
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("SellerBundlesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { profileId: "seller-1", role: "SELLER", token: "tok" };
  });

  it("shows access-denied message when user is not a seller", () => {
    mockUser = null;
    render(<SellerBundlesPage />);
    expect(screen.getByText(/please log in as a seller/i)).toBeInTheDocument();
  });

  it("shows loading state while fetching", () => {
    vi.mocked(bundlesApi.bySeller).mockReturnValue(new Promise(() => {}));
    render(<SellerBundlesPage />);
    expect(screen.getByText(/loading bundles/i)).toBeInTheDocument();
  });

  it("renders bundle cards after loading", async () => {
    vi.mocked(bundlesApi.bySeller).mockResolvedValueOnce([draft, active, closed]);
    render(<SellerBundlesPage />);
    await waitFor(() => expect(screen.getByText("Draft Bundle")).toBeInTheDocument());
    expect(screen.getByText("Active Bundle")).toBeInTheDocument();
    expect(screen.getByText("Closed Bundle")).toBeInTheDocument();
  });

  it("shows link to create a new bundle", async () => {
    vi.mocked(bundlesApi.bySeller).mockResolvedValueOnce([]);
    render(<SellerBundlesPage />);
    await waitFor(() => screen.getByText(/my bundles/i));
    expect(screen.getByRole("link", { name: /\+ new bundle/i })).toBeInTheDocument();
  });

  it("renders filter tabs including ALL, DRAFT, ACTIVE, CLOSED, CANCELLED", async () => {
    vi.mocked(bundlesApi.bySeller).mockResolvedValueOnce([draft]);
    render(<SellerBundlesPage />);
    await waitFor(() => screen.getByText("Draft Bundle"));
    expect(screen.getByRole("button", { name: /^all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^draft/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^active/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^closed/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^cancelled/i })).toBeInTheDocument();
  });

  it("shows counts in filter tabs", async () => {
    vi.mocked(bundlesApi.bySeller).mockResolvedValueOnce([draft, active, closed]);
    render(<SellerBundlesPage />);
    await waitFor(() => screen.getByText("Draft Bundle"));
    expect(screen.getByRole("button", { name: /all \(3\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /draft \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /active \(1\)/i })).toBeInTheDocument();
  });

  it("filters to show only draft bundles when DRAFT tab is clicked", async () => {
    vi.mocked(bundlesApi.bySeller).mockResolvedValueOnce([draft, active, closed]);
    const user = userEvent.setup();
    render(<SellerBundlesPage />);
    await waitFor(() => screen.getByText("Active Bundle"));
    await user.click(screen.getByRole("button", { name: /^draft/i }));
    expect(screen.getByText("Draft Bundle")).toBeInTheDocument();
    expect(screen.queryByText("Active Bundle")).not.toBeInTheDocument();
    expect(screen.queryByText("Closed Bundle")).not.toBeInTheDocument();
  });

  it("shows empty state message for a filter with no matching bundles", async () => {
    vi.mocked(bundlesApi.bySeller).mockResolvedValueOnce([draft]);
    const user = userEvent.setup();
    render(<SellerBundlesPage />);
    await waitFor(() => screen.getByText("Draft Bundle"));
    await user.click(screen.getByRole("button", { name: /^active/i }));
    expect(screen.getByText(/no active bundles/i)).toBeInTheDocument();
  });

  it("shows 'Activate' button on DRAFT bundle cards", async () => {
    vi.mocked(bundlesApi.bySeller).mockResolvedValueOnce([draft]);
    render(<SellerBundlesPage />);
    await waitFor(() => screen.getByText("Draft Bundle"));
    expect(screen.getByRole("button", { name: /activate/i })).toBeInTheDocument();
  });

  it("shows 'Close' button on ACTIVE bundle cards", async () => {
    vi.mocked(bundlesApi.bySeller).mockResolvedValueOnce([active]);
    render(<SellerBundlesPage />);
    await waitFor(() => screen.getByText("Active Bundle"));
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("calls bundlesApi.activate and reloads when Activate is clicked", async () => {
    vi.mocked(bundlesApi.bySeller)
      .mockResolvedValueOnce([draft])
      .mockResolvedValueOnce([{ ...draft, status: "ACTIVE" }]);
    vi.mocked(bundlesApi.activate).mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<SellerBundlesPage />);
    await waitFor(() => screen.getByRole("button", { name: /activate/i }));
    await user.click(screen.getByRole("button", { name: /activate/i }));
    await waitFor(() => expect(bundlesApi.activate).toHaveBeenCalledWith("p1", "tok"));
    expect(bundlesApi.bySeller).toHaveBeenCalledTimes(2);
  });

  it("calls bundlesApi.close and reloads when Close is confirmed", async () => {
    vi.mocked(bundlesApi.bySeller)
      .mockResolvedValueOnce([active])
      .mockResolvedValueOnce([{ ...active, status: "CLOSED" }]);
    vi.mocked(bundlesApi.close).mockResolvedValueOnce({});
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    const user = userEvent.setup();
    render(<SellerBundlesPage />);
    await waitFor(() => screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(bundlesApi.close).toHaveBeenCalledWith("p2", "tok"));
  });

  it("does not call bundlesApi.close when Close is cancelled in confirm dialog", async () => {
    vi.mocked(bundlesApi.bySeller).mockResolvedValueOnce([active]);
    vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    const user = userEvent.setup();
    render(<SellerBundlesPage />);
    await waitFor(() => screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(bundlesApi.close).not.toHaveBeenCalled();
  });

  it("shows error alert when API fetch fails", async () => {
    vi.mocked(bundlesApi.bySeller).mockRejectedValueOnce(new Error("Server error"));
    render(<SellerBundlesPage />);
    await waitFor(() =>
      expect(screen.getByText(/failed to load bundles/i)).toBeInTheDocument()
    );
  });
});
