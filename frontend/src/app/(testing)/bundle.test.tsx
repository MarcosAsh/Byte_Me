import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BundlesPage from "@/app/(public)/bundles/page";
import { bundlesApi } from "@/lib/api/api";
import type { BundlePosting } from "@/lib/api/types";

// ── API mock ──────────────────────────────────────────────────────────────────
vi.mock("@/lib/api/api", () => ({
  bundlesApi: {
    list: vi.fn(),
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockBundles: BundlePosting[] = [
  {
    postingId: "p1",
    title: "Mixed Bakery Bag",
    description: "Assorted pastries",
    priceCents: 500,
    discountPct: 20,
    quantityTotal: 5,
    quantityReserved: 1,
    pickupStartAt: "2026-03-20T09:00:00Z",
    pickupEndAt: "2026-03-20T11:00:00Z",
    status: "ACTIVE",
    createdAt: "2026-03-19T08:00:00Z",
    seller: { sellerId: "s1", name: "City Bakery", locationText: "123 High St", createdAt: "2026-01-01T00:00:00Z" },
    category: { categoryId: "c1", name: "Bakery" },
  },
  {
    postingId: "p2",
    title: "Veggie Box",
    description: "Fresh vegetables",
    priceCents: 300,
    discountPct: 0,
    quantityTotal: 3,
    quantityReserved: 3,
    pickupStartAt: "2026-03-20T10:00:00Z",
    pickupEndAt: "2026-03-20T12:00:00Z",
    status: "ACTIVE",
    createdAt: "2026-03-19T09:00:00Z",
    seller: { sellerId: "s2", name: "Green Farm", locationText: "456 Market Rd", createdAt: "2026-01-01T00:00:00Z" },
    category: { categoryId: "c2", name: "Produce" },
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("BundlesPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a loading state initially", () => {
    vi.mocked(bundlesApi.list).mockReturnValue(new Promise(() => {}));
    render(<BundlesPage />);
    expect(screen.getByText(/loading bundles/i)).toBeInTheDocument();
  });

  it("renders bundle cards after loading", async () => {
    vi.mocked(bundlesApi.list).mockResolvedValueOnce({ content: mockBundles });
    render(<BundlesPage />);
    await waitFor(() => expect(screen.getByText("Mixed Bakery Bag")).toBeInTheDocument());
    expect(screen.getByText("Veggie Box")).toBeInTheDocument();
  });

  it("shows seller names on bundle cards", async () => {
    vi.mocked(bundlesApi.list).mockResolvedValueOnce({ content: mockBundles });
    render(<BundlesPage />);
    await waitFor(() => expect(screen.getByText("City Bakery")).toBeInTheDocument());
    expect(screen.getByText("Green Farm")).toBeInTheDocument();
  });

  it("shows discounted price and original price when discount applies", async () => {
    vi.mocked(bundlesApi.list).mockResolvedValueOnce({ content: mockBundles });
    render(<BundlesPage />);
    // $4.00 discounted (500 * 0.8 = 400 cents), $5.00 original
    await waitFor(() => expect(screen.getByText("£4.00")).toBeInTheDocument());
    expect(screen.getByText("£5.00")).toBeInTheDocument();
  });

  it("shows discount badge when discount is applied", async () => {
    vi.mocked(bundlesApi.list).mockResolvedValueOnce({ content: mockBundles });
    render(<BundlesPage />);
    await waitFor(() => expect(screen.getByText("20% off")).toBeInTheDocument());
  });

  it("shows availability count on each card", async () => {
    vi.mocked(bundlesApi.list).mockResolvedValueOnce({ content: mockBundles });
    render(<BundlesPage />);
    // 5 - 1 = 4 available for Mixed Bakery Bag
    await waitFor(() => expect(screen.getByText("4 available")).toBeInTheDocument());
    // 3 - 3 = 0 available for Veggie Box
    expect(screen.getByText("0 available")).toBeInTheDocument();
  });

  it("shows an error alert when the API fails", async () => {
    vi.mocked(bundlesApi.list).mockRejectedValueOnce(new Error("Network error"));
    render(<BundlesPage />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to load bundles/i)
    );
  });

  it("shows empty state when no bundles match the search query", async () => {
    vi.mocked(bundlesApi.list).mockResolvedValueOnce({ content: mockBundles });
    const user = userEvent.setup();
    render(<BundlesPage />);
    await waitFor(() => screen.getByText("Mixed Bakery Bag"));
    await user.type(screen.getByPlaceholderText(/search bundles/i), "xyznotfound");
    expect(screen.getByText(/no bundles found/i)).toBeInTheDocument();
  });

  it("filters bundles by search term matching title", async () => {
    vi.mocked(bundlesApi.list).mockResolvedValueOnce({ content: mockBundles });
    const user = userEvent.setup();
    render(<BundlesPage />);
    await waitFor(() => screen.getByText("Mixed Bakery Bag"));
    await user.type(screen.getByPlaceholderText(/search bundles/i), "veggie");
    expect(screen.queryByText("Mixed Bakery Bag")).not.toBeInTheDocument();
    expect(screen.getByText("Veggie Box")).toBeInTheDocument();
  });

  it("filters bundles by search term matching seller name", async () => {
    vi.mocked(bundlesApi.list).mockResolvedValueOnce({ content: mockBundles });
    const user = userEvent.setup();
    render(<BundlesPage />);
    await waitFor(() => screen.getByText("Mixed Bakery Bag"));
    await user.type(screen.getByPlaceholderText(/search bundles/i), "city bakery");
    expect(screen.getByText("Mixed Bakery Bag")).toBeInTheDocument();
    expect(screen.queryByText("Veggie Box")).not.toBeInTheDocument();
  });

  it("renders category filter buttons from bundle data", async () => {
    vi.mocked(bundlesApi.list).mockResolvedValueOnce({ content: mockBundles });
    render(<BundlesPage />);
    await waitFor(() => screen.getByText("Mixed Bakery Bag"));
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bakery" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Produce" })).toBeInTheDocument();
  });

  it("filters bundles when a category button is clicked", async () => {
    vi.mocked(bundlesApi.list).mockResolvedValueOnce({ content: mockBundles });
    const user = userEvent.setup();
    render(<BundlesPage />);
    await waitFor(() => screen.getByText("Mixed Bakery Bag"));
    await user.click(screen.getByRole("button", { name: "Bakery" }));
    expect(screen.getByText("Mixed Bakery Bag")).toBeInTheDocument();
    expect(screen.queryByText("Veggie Box")).not.toBeInTheDocument();
  });

  it("shows all bundles when 'All' category is selected", async () => {
    vi.mocked(bundlesApi.list).mockResolvedValueOnce({ content: mockBundles });
    const user = userEvent.setup();
    render(<BundlesPage />);
    await waitFor(() => screen.getByText("Mixed Bakery Bag"));
    await user.click(screen.getByRole("button", { name: "Bakery" }));
    await user.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("Mixed Bakery Bag")).toBeInTheDocument();
    expect(screen.getByText("Veggie Box")).toBeInTheDocument();
  });

  it("renders bundle cards as links to detail pages", async () => {
    vi.mocked(bundlesApi.list).mockResolvedValueOnce({ content: mockBundles });
    render(<BundlesPage />);
    await waitFor(() => screen.getByText("Mixed Bakery Bag"));
    const links = screen.getAllByRole("link");
    const bundleLink = links.find((l) => l.getAttribute("href") === "/bundles/p1");
    expect(bundleLink).toBeInTheDocument();
  });
});
