import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import OrgDashboardPage from "@/app/(org)/home/page";
import { ordersApi, gamificationApi, issuesApi } from "@/lib/api/api";

// ── API mocks ─────────────────────────────────────────────────────────────────
vi.mock("@/lib/api/api", () => ({
  ordersApi: { byOrg: vi.fn() },
  gamificationApi: { stats: vi.fn(), streak: vi.fn() },
  issuesApi: { byOrg: vi.fn() },
}));

// ── Auth store helpers ────────────────────────────────────────────────────────
let mockUser: { profileId: string; role: string; token: string } | null = null;

vi.mock("@/store/auth.store", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockStats = {
  totalReservations: 12,
  currentStreakWeeks: 3,
  badgesEarned: 2,
  mealsRescued: 24,
  co2eSavedGrams: 5000,
};

const mockStreak = { currentStreakWeeks: 3, bestStreakWeeks: 5 };

const mockReservations = [
  {
    reservationId: "r1",
    postingTitle: "Bakery Box",
    sellerName: "City Bakery",
    priceCents: 400,
    pickupStartAt: "2026-03-20T09:00:00Z",
    pickupEndAt: "2026-03-20T11:00:00Z",
    status: "COLLECTED",
    reservedAt: "2026-03-19T10:00:00Z",
  },
  {
    reservationId: "r2",
    postingTitle: "Veggie Box",
    sellerName: "Green Farm",
    priceCents: 300,
    pickupStartAt: "2026-03-21T09:00:00Z",
    pickupEndAt: "2026-03-21T11:00:00Z",
    status: "RESERVED",
    reservedAt: "2026-03-20T10:00:00Z",
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("OrgDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { profileId: "org-1", role: "ORG_ADMIN", token: "tok" };
    vi.mocked(ordersApi.byOrg).mockResolvedValue(mockReservations);
    vi.mocked(gamificationApi.stats).mockResolvedValue(mockStats);
    vi.mocked(gamificationApi.streak).mockResolvedValue(mockStreak);
    vi.mocked(issuesApi.byOrg).mockResolvedValue([]);
  });

  it("shows access-denied message when user is not ORG_ADMIN", () => {
    mockUser = null;
    render(<OrgDashboardPage />);
    expect(screen.getByText(/please log in as an organisation/i)).toBeInTheDocument();
  });

  it("shows loading state while fetching", () => {
    vi.mocked(ordersApi.byOrg).mockReturnValue(new Promise(() => {}));
    render(<OrgDashboardPage />);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it("renders the dashboard heading", async () => {
    render(<OrgDashboardPage />);
    await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());
  });

  it("shows total rescues stat card", async () => {
    render(<OrgDashboardPage />);
    await waitFor(() => expect(screen.getByText("12")).toBeInTheDocument());
    expect(screen.getByText(/total rescues/i)).toBeInTheDocument();
  });

  it("shows current streak stat card", async () => {
    render(<OrgDashboardPage />);
    await waitFor(() => expect(screen.getByText("3w")).toBeInTheDocument());
    expect(screen.getByText(/current streak/i)).toBeInTheDocument();
  });

  it("calculates and shows collection rate", async () => {
    // 1 COLLECTED out of 1 finished (COLLECTED) → 100%
    render(<OrgDashboardPage />);
    await waitFor(() => expect(screen.getByText("100%")).toBeInTheDocument());
  });

  it("shows active reservation count", async () => {
    render(<OrgDashboardPage />);
    // 1 RESERVED reservation
    await waitFor(() => {
      const activeCard = screen.getByText(/^active$/i).closest("div");
      expect(activeCard).toHaveTextContent("1");
    });
  });

  it("shows 0 open issues when there are none", async () => {
    render(<OrgDashboardPage />);
    await waitFor(() => {
      const issueCard = screen.getByText(/open issues/i).closest("div");
      expect(issueCard).toHaveTextContent("0");
    });
  });

  it("shows correct open issue count when issues exist", async () => {
    vi.mocked(issuesApi.byOrg).mockResolvedValueOnce([
      { issueId: "i1", status: "OPEN", type: "QUALITY", description: "Issue 1", createdAt: "" },
      { issueId: "i2", status: "CLOSED", type: "MISSING", description: "Issue 2", createdAt: "" },
    ]);
    render(<OrgDashboardPage />);
    await waitFor(() => {
      const issueCard = screen.getByText(/open issues/i).closest("div");
      expect(issueCard).toHaveTextContent("1");
    });
  });

  it("shows recent reservations table", async () => {
    render(<OrgDashboardPage />);
    await waitFor(() => expect(screen.getByText("Bakery Box")).toBeInTheDocument());
    expect(screen.getByText("Veggie Box")).toBeInTheDocument();
    expect(screen.getByText("City Bakery")).toBeInTheDocument();
  });

  it("shows empty state when no reservations exist", async () => {
    vi.mocked(ordersApi.byOrg).mockResolvedValueOnce([]);
    render(<OrgDashboardPage />);
    await waitFor(() =>
      expect(screen.getByText(/no reservations yet/i)).toBeInTheDocument()
    );
  });

  it("renders quick-link cards to Browse Bundles, Reservations and Achievements", async () => {
    render(<OrgDashboardPage />);
    await waitFor(() => screen.getByText("Dashboard"));
    expect(screen.getByRole("link", { name: /browse bundles/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /reservations/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /achievements/i })).toBeInTheDocument();
  });

  it("shows error alert when API fails", async () => {
    vi.mocked(ordersApi.byOrg).mockRejectedValueOnce(new Error("Server error"));
    render(<OrgDashboardPage />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to load dashboard/i)
    );
  });
});
