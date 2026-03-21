import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SellerDashboardPage from "@/app/(seller)/dashboard/page";
import { analyticsApi, ordersApi, issuesApi } from "@/lib/api/api";
import type { DashboardResponse, WasteAvoidedResponse } from "@/lib/api/types";

// ── API mocks ─────────────────────────────────────────────────────────────────
vi.mock("@/lib/api/api", () => ({
  analyticsApi: { dashboard: vi.fn(), wasteAvoided: vi.fn() },
  ordersApi: { bySeller: vi.fn(), collect: vi.fn(), cancel: vi.fn() },
  issuesApi: { openBySeller: vi.fn() },
}));

// ── Auth store helpers ────────────────────────────────────────────────────────
let mockUser: { profileId: string; role: string; token: string } | null = null;

vi.mock("@/store/auth.store", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockDashboard: DashboardResponse = {
  sellerName: "City Bakery",
  totalBundlesPosted: 20,
  totalQuantity: 80,
  collectedCount: 55,
  cancelledCount: 5,
  expiredCount: 3,
  sellThroughRate: 75,
  openIssueCount: 2,
};

const mockWaste: WasteAvoidedResponse = {
  wasteAvoidedGrams: 82500,
  wasteAvoidedKg: 82.5,
  co2eAvoidedKg: 206.25,
  avgWeightPerBundleKg: 1.5,
  totalBundlesCollected: 55,
};

const mockOrders = [
  {
    reservationId: "o1",
    postingTitle: "Bakery Box",
    organisationName: "Food Bank A",
    status: "RESERVED",
    reservedAt: "2026-03-19T10:00:00Z",
  },
  {
    reservationId: "o2",
    postingTitle: "Veggie Pack",
    organisationName: "Shelter B",
    status: "COLLECTED",
    reservedAt: "2026-03-18T10:00:00Z",
    collectedAt: "2026-03-18T11:00:00Z",
  },
];

const mockIssues = [
  {
    issueId: "i1",
    type: "QUALITY" as const,
    description: "Bundle was stale",
    status: "OPEN" as const,
    createdAt: "2026-03-18T08:00:00Z",
  },
];

function setupMocks() {
  vi.mocked(analyticsApi.dashboard).mockResolvedValue(mockDashboard);
  vi.mocked(analyticsApi.wasteAvoided).mockResolvedValue(mockWaste);
  vi.mocked(ordersApi.bySeller).mockResolvedValue(mockOrders);
  vi.mocked(issuesApi.openBySeller).mockResolvedValue(mockIssues);
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("SellerDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { profileId: "seller-1", role: "SELLER", token: "tok" };
  });

  it("shows access-denied message when user is not a seller", () => {
    mockUser = null;
    render(<SellerDashboardPage />);
    expect(screen.getByText(/please log in as a seller/i)).toBeInTheDocument();
  });

  it("shows loading state while fetching", () => {
    vi.mocked(analyticsApi.dashboard).mockReturnValue(new Promise(() => {}));
    vi.mocked(analyticsApi.wasteAvoided).mockReturnValue(new Promise(() => {}));
    vi.mocked(ordersApi.bySeller).mockReturnValue(new Promise(() => {}));
    vi.mocked(issuesApi.openBySeller).mockReturnValue(new Promise(() => {}));
    render(<SellerDashboardPage />);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it("renders welcome message with seller name", async () => {
    setupMocks();
    render(<SellerDashboardPage />);
    await waitFor(() =>
      expect(screen.getByText(/welcome back, city bakery/i)).toBeInTheDocument()
    );
  });

  it("renders all stat cards", async () => {
    setupMocks();
    render(<SellerDashboardPage />);
    await waitFor(() => expect(screen.getByText("20")).toBeInTheDocument());
    expect(screen.getByText(/bundles posted/i)).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText(/sell-through rate/i)).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();
    expect(screen.getByText("Collected")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Open Issues")).toBeInTheDocument();
  });

  it("renders waste avoided section when bundles have been collected", async () => {
    setupMocks();
    render(<SellerDashboardPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /waste avoided/i })).toBeInTheDocument()
    );
    expect(screen.getByText("82.5 kg")).toBeInTheDocument();
    expect(screen.getByText(/food waste avoided/i)).toBeInTheDocument();
    expect(screen.getByText("206.25 kg")).toBeInTheDocument();
    expect(screen.getByText(/co2e avoided/i)).toBeInTheDocument();
  });

  it("does not render waste avoided section when no bundles collected", async () => {
    vi.mocked(analyticsApi.dashboard).mockResolvedValue(mockDashboard);
    vi.mocked(analyticsApi.wasteAvoided).mockResolvedValue({
      ...mockWaste,
      totalBundlesCollected: 0,
    });
    vi.mocked(ordersApi.bySeller).mockResolvedValue([]);
    vi.mocked(issuesApi.openBySeller).mockResolvedValue([]);
    render(<SellerDashboardPage />);
    await waitFor(() => screen.getByText(/bundles posted/i));
    expect(screen.queryByText(/waste avoided/i)).not.toBeInTheDocument();
  });

  it("renders quick links to analytics, bundle creation, insights and issues", async () => {
    setupMocks();
    render(<SellerDashboardPage />);
    await waitFor(() => screen.getByText(/demand forecasting/i));
    expect(screen.getByRole("link", { name: /demand forecasting/i })).toHaveAttribute("href", "/analytics");
    expect(screen.getByRole("link", { name: /create bundle/i })).toHaveAttribute("href", "/bundle");
    expect(screen.getByRole("link", { name: /insights/i })).toHaveAttribute("href", "/insights");
    expect(screen.getByRole("link", { name: /issues/i })).toHaveAttribute("href", "/issues");
  });

  it("renders recent orders table with bundle and org names", async () => {
    setupMocks();
    render(<SellerDashboardPage />);
    await waitFor(() => expect(screen.getByText("Bakery Box")).toBeInTheDocument());
    expect(screen.getByText("Food Bank A")).toBeInTheDocument();
    expect(screen.getByText("Veggie Pack")).toBeInTheDocument();
    expect(screen.getByText("Shelter B")).toBeInTheDocument();
  });

  it("shows empty state when there are no orders", async () => {
    vi.mocked(analyticsApi.dashboard).mockResolvedValue(mockDashboard);
    vi.mocked(analyticsApi.wasteAvoided).mockResolvedValue(mockWaste);
    vi.mocked(ordersApi.bySeller).mockResolvedValue([]);
    vi.mocked(issuesApi.openBySeller).mockResolvedValue([]);
    render(<SellerDashboardPage />);
    await waitFor(() =>
      expect(screen.getByText(/no orders yet/i)).toBeInTheDocument()
    );
  });

  it("shows Mark Collected and Cancel buttons only for RESERVED orders", async () => {
    setupMocks();
    render(<SellerDashboardPage />);
    await waitFor(() => screen.getByText("Bakery Box"));
    expect(screen.getByRole("button", { name: /mark collected/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    // COLLECTED order should have no action buttons
    expect(screen.getAllByRole("button").filter(b => b.textContent === "Mark Collected")).toHaveLength(1);
  });

  it("prompts for claim code and calls ordersApi.collect on Mark Collected", async () => {
    setupMocks();
    vi.mocked(ordersApi.collect).mockResolvedValueOnce({});
    vi.spyOn(window, "prompt").mockReturnValueOnce("ABC123");
    const user = userEvent.setup();
    render(<SellerDashboardPage />);
    await waitFor(() => screen.getByRole("button", { name: /mark collected/i }));
    await user.click(screen.getByRole("button", { name: /mark collected/i }));
    expect(window.prompt).toHaveBeenCalled();
    await waitFor(() =>
      expect(ordersApi.collect).toHaveBeenCalledWith("o1", "ABC123", "tok")
    );
  });

  it("does not call collect when prompt is cancelled", async () => {
    setupMocks();
    vi.spyOn(window, "prompt").mockReturnValueOnce(null);
    const user = userEvent.setup();
    render(<SellerDashboardPage />);
    await waitFor(() => screen.getByRole("button", { name: /mark collected/i }));
    await user.click(screen.getByRole("button", { name: /mark collected/i }));
    expect(ordersApi.collect).not.toHaveBeenCalled();
  });

  it("calls ordersApi.cancel and reloads when Cancel is clicked", async () => {
    setupMocks();
    vi.mocked(ordersApi.cancel).mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<SellerDashboardPage />);
    await waitFor(() => screen.getByRole("button", { name: /^cancel$/i }));
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    await waitFor(() =>
      expect(ordersApi.cancel).toHaveBeenCalledWith("o1", "tok")
    );
  });

  it("shows open issues section with issue descriptions", async () => {
    setupMocks();
    render(<SellerDashboardPage />);
    await waitFor(() =>
      expect(screen.getByText(/open issues \(1\)/i)).toBeInTheDocument()
    );
    expect(screen.getByText("Bundle was stale")).toBeInTheDocument();
    expect(screen.getByText("QUALITY")).toBeInTheDocument();
  });

  it("does not show open issues section when there are none", async () => {
    vi.mocked(analyticsApi.dashboard).mockResolvedValue(mockDashboard);
    vi.mocked(analyticsApi.wasteAvoided).mockResolvedValue(mockWaste);
    vi.mocked(ordersApi.bySeller).mockResolvedValue(mockOrders);
    vi.mocked(issuesApi.openBySeller).mockResolvedValue([]);
    render(<SellerDashboardPage />);
    await waitFor(() => screen.getByText("Bakery Box"));
    expect(screen.queryByRole("heading", { name: /open issues/i })).not.toBeInTheDocument();
  });

  it("shows Respond link for each open issue pointing to /issues", async () => {
    setupMocks();
    render(<SellerDashboardPage />);
    await waitFor(() => screen.getByText("Bundle was stale"));
    const respondLinks = screen.getAllByRole("link", { name: /respond/i });
    expect(respondLinks[respondLinks.length - 1]).toHaveAttribute("href", "/issues");  
  });

  it("shows error alert when API call fails", async () => {
    vi.mocked(analyticsApi.dashboard).mockRejectedValueOnce(new Error("Server error"));
    vi.mocked(analyticsApi.wasteAvoided).mockResolvedValue(mockWaste);
    vi.mocked(ordersApi.bySeller).mockResolvedValue([]);
    vi.mocked(issuesApi.openBySeller).mockResolvedValue([]);
    render(<SellerDashboardPage />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to load dashboard/i)
    );
  });

  it("shows error alert when collect fails", async () => {
    setupMocks();
    vi.mocked(ordersApi.collect).mockRejectedValueOnce(new Error("Bad code"));
    vi.spyOn(window, "prompt").mockReturnValueOnce("WRONG1");
    const user = userEvent.setup();
    render(<SellerDashboardPage />);
    await waitFor(() => screen.getByRole("button", { name: /mark collected/i }));
    await user.click(screen.getByRole("button", { name: /mark collected/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/invalid claim code/i)
    );
  });
});
