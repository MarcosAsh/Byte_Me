import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import InsightsPage from "@/app/(seller)/insights/page";
import { analyticsApi } from "@/lib/api/api";
import type { PricingRow, WindowRow, CategoryRow } from "@/lib/api/types";

// ── API mock ──────────────────────────────────────────────────────────────────
vi.mock("@/lib/api/api", () => ({
  analyticsApi: {
    pricing: vi.fn(),
    popularWindows: vi.fn(),
    popularCategories: vi.fn(),
  },
}));

// ── Recharts stub ─────────────────────────────────────────────────────────────
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

// ── Auth store helpers ────────────────────────────────────────────────────────
let mockUser: { profileId: string; role: string; token: string } | null = null;

vi.mock("@/store/auth.store", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockPricing: PricingRow[] = [
  { bracket: "0%",   bundleCount: 5,  totalQuantity: 20, collectedCount: 12, sellThroughRate: 60.0 },
  { bracket: "10%",  bundleCount: 8,  totalQuantity: 32, collectedCount: 26, sellThroughRate: 81.25 },
  { bracket: "20%+", bundleCount: 3,  totalQuantity: 12, collectedCount: 11, sellThroughRate: 91.7 },
];

const mockWindows: WindowRow[] = [
  { windowLabel: "08:00-10:00", totalReservations: 20, collectedCount: 16, noShowCount: 4, collectionRate: 80.0 },
  { windowLabel: "12:00-14:00", totalReservations: 15, collectedCount: 10, noShowCount: 5, collectionRate: 66.7 },
];

const mockCategories: CategoryRow[] = [
  { categoryName: "Bakery",  bundlesPosted: 10, totalQuantity: 40, collectedCount: 34, sellThroughRate: 85.0 },
  { categoryName: "Produce", bundlesPosted: 6,  totalQuantity: 24, collectedCount: 18, sellThroughRate: 75.0 },
];

function setupMocks() {
  vi.mocked(analyticsApi.pricing).mockResolvedValue(mockPricing);
  vi.mocked(analyticsApi.popularWindows).mockResolvedValue(mockWindows);
  vi.mocked(analyticsApi.popularCategories).mockResolvedValue(mockCategories);
}

// ── Helper: get a card section by its h2 heading ──────────────────────────────
function getSection(heading: RegExp): HTMLElement {
  return screen.getByRole("heading", { name: heading }).closest(".card") as HTMLElement;
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("InsightsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { profileId: "seller-1", role: "SELLER", token: "tok" };
  });

  // Access guard
  it("shows access-denied message when user is not a seller", () => {
    mockUser = null;
    render(<InsightsPage />);
    expect(screen.getByText(/please log in as a seller/i)).toBeInTheDocument();
  });

  it("shows access-denied message when user is ORG_ADMIN", () => {
    mockUser = { profileId: "org-1", role: "ORG_ADMIN", token: "tok" };
    render(<InsightsPage />);
    expect(screen.getByText(/please log in as a seller/i)).toBeInTheDocument();
  });

  // Loading
  it("shows loading state while fetching", () => {
    vi.mocked(analyticsApi.pricing).mockReturnValue(new Promise(() => {}));
    vi.mocked(analyticsApi.popularWindows).mockReturnValue(new Promise(() => {}));
    vi.mocked(analyticsApi.popularCategories).mockReturnValue(new Promise(() => {}));
    render(<InsightsPage />);
    expect(screen.getByText(/loading insights/i)).toBeInTheDocument();
  });

  // Page structure
  it("renders page heading after loading", async () => {
    setupMocks();
    render(<InsightsPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /^insights$/i })).toBeInTheDocument()
    );
  });

  it("renders all three section headings", async () => {
    setupMocks();
    render(<InsightsPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /pricing effectiveness/i })).toBeInTheDocument()
    );
    expect(screen.getByRole("heading", { name: /best pickup windows/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /most popular categories/i })).toBeInTheDocument();
  });

  // Error
  it("shows error alert when API call fails", async () => {
    vi.mocked(analyticsApi.pricing).mockRejectedValueOnce(new Error("Server error"));
    vi.mocked(analyticsApi.popularWindows).mockResolvedValue([]);
    vi.mocked(analyticsApi.popularCategories).mockResolvedValue([]);
    render(<InsightsPage />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to load insights/i)
    );
  });

  // ── Pricing section ──────────────────────────────────────────────────────
  it("renders pricing table rows with correct data", async () => {
    setupMocks();
    render(<InsightsPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /pricing effectiveness/i })).toBeInTheDocument()
    );
    const section = getSection(/pricing effectiveness/i);
    expect(within(section).getByText("0%")).toBeInTheDocument();
    expect(within(section).getByText("10%")).toBeInTheDocument();
    expect(within(section).getByText("20%+")).toBeInTheDocument();
    expect(within(section).getByText("60.0%")).toBeInTheDocument();
    expect(within(section).getByText("81.3%")).toBeInTheDocument();
    expect(within(section).getByText("91.7%")).toBeInTheDocument();
  });

  it("renders pricing table column headers", async () => {
    setupMocks();
    render(<InsightsPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /pricing effectiveness/i })).toBeInTheDocument()
    );
    const section = getSection(/pricing effectiveness/i);
    expect(within(section).getByRole("columnheader", { name: /bracket/i })).toBeInTheDocument();
    expect(within(section).getByRole("columnheader", { name: /bundles/i })).toBeInTheDocument();
    expect(within(section).getByRole("columnheader", { name: /quantity/i })).toBeInTheDocument();
    expect(within(section).getByRole("columnheader", { name: /collected/i })).toBeInTheDocument();
    expect(within(section).getByRole("columnheader", { name: /sell-through/i })).toBeInTheDocument();
  });

  it("shows empty state for pricing when all bracket counts are zero", async () => {
    vi.mocked(analyticsApi.pricing).mockResolvedValue(
      mockPricing.map((r) => ({ ...r, bundleCount: 0 }))
    );
    vi.mocked(analyticsApi.popularWindows).mockResolvedValue(mockWindows);
    vi.mocked(analyticsApi.popularCategories).mockResolvedValue(mockCategories);
    render(<InsightsPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /pricing effectiveness/i })).toBeInTheDocument()
    );
    const section = getSection(/pricing effectiveness/i);
    expect(within(section).getByText(/no bundle data available/i)).toBeInTheDocument();
  });

  // ── Windows section ──────────────────────────────────────────────────────
  it("renders pickup window table rows with correct data", async () => {
    setupMocks();
    render(<InsightsPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /best pickup windows/i })).toBeInTheDocument()
    );
    const section = getSection(/best pickup windows/i);
    expect(within(section).getByText("08:00-10:00")).toBeInTheDocument();
    expect(within(section).getByText("12:00-14:00")).toBeInTheDocument();
    expect(within(section).getByText("80.0%")).toBeInTheDocument();
    expect(within(section).getByText("66.7%")).toBeInTheDocument();
  });

  it("renders window table column headers", async () => {
    setupMocks();
    render(<InsightsPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /best pickup windows/i })).toBeInTheDocument()
    );
    const section = getSection(/best pickup windows/i);
    expect(within(section).getByRole("columnheader", { name: /window/i })).toBeInTheDocument();
    expect(within(section).getByRole("columnheader", { name: /reservations/i })).toBeInTheDocument();
    expect(within(section).getByRole("columnheader", { name: /no-shows/i })).toBeInTheDocument();
    expect(within(section).getByRole("columnheader", { name: /collection rate/i })).toBeInTheDocument();
  });

  it("shows empty state for windows when list is empty", async () => {
    vi.mocked(analyticsApi.pricing).mockResolvedValue(mockPricing);
    vi.mocked(analyticsApi.popularWindows).mockResolvedValue([]);
    vi.mocked(analyticsApi.popularCategories).mockResolvedValue(mockCategories);
    render(<InsightsPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /best pickup windows/i })).toBeInTheDocument()
    );
    const section = getSection(/best pickup windows/i);
    expect(within(section).getByText(/no reservation data available/i)).toBeInTheDocument();
  });

  it("shows no-show counts in the windows table", async () => {
    setupMocks();
    render(<InsightsPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /best pickup windows/i })).toBeInTheDocument()
    );
    const section = getSection(/best pickup windows/i);
    expect(within(section).getByText("4")).toBeInTheDocument();
    expect(within(section).getByText("5")).toBeInTheDocument();
  });

  // ── Categories section ────────────────────────────────────────────────────
  it("renders category table rows with correct data", async () => {
    setupMocks();
    render(<InsightsPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /most popular categories/i })).toBeInTheDocument()
    );
    const section = getSection(/most popular categories/i);
    expect(within(section).getByText("Bakery")).toBeInTheDocument();
    expect(within(section).getByText("Produce")).toBeInTheDocument();
    expect(within(section).getByText("85.0%")).toBeInTheDocument();
    expect(within(section).getByText("75.0%")).toBeInTheDocument();
  });

  it("renders category table column headers", async () => {
    setupMocks();
    render(<InsightsPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /most popular categories/i })).toBeInTheDocument()
    );
    const section = getSection(/most popular categories/i);
    expect(within(section).getByRole("columnheader", { name: /category/i })).toBeInTheDocument();
    expect(within(section).getByRole("columnheader", { name: /sell-through/i })).toBeInTheDocument();
  });

  it("shows empty state for categories when list is empty", async () => {
    vi.mocked(analyticsApi.pricing).mockResolvedValue(mockPricing);
    vi.mocked(analyticsApi.popularWindows).mockResolvedValue(mockWindows);
    vi.mocked(analyticsApi.popularCategories).mockResolvedValue([]);
    render(<InsightsPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /most popular categories/i })).toBeInTheDocument()
    );
    const section = getSection(/most popular categories/i);
    expect(within(section).getByText(/no bundle data available/i)).toBeInTheDocument();
  });

  it("renders correct bundle and quantity counts in category table", async () => {
    setupMocks();
    render(<InsightsPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /most popular categories/i })).toBeInTheDocument()
    );
    const section = getSection(/most popular categories/i);
    expect(within(section).getByText("10")).toBeInTheDocument();
    expect(within(section).getByText("40")).toBeInTheDocument();
    expect(within(section).getByText("6")).toBeInTheDocument();
    expect(within(section).getByText("24")).toBeInTheDocument();
  });
});
