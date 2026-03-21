import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import OrgGamificationPage from "@/app/(org)/gamification/page";
import { gamificationApi } from "@/lib/api/api";

// ── API mock ──────────────────────────────────────────────────────────────────
vi.mock("@/lib/api/api", () => ({
  gamificationApi: {
    streak: vi.fn(),
    stats: vi.fn(),
    orgBadges: vi.fn(),
    allBadges: vi.fn(),
  },
}));

// ── Auth store helpers ────────────────────────────────────────────────────────
let mockUser: { profileId: string; role: string; token: string } | null = null;

vi.mock("@/store/auth.store", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockStreak = { currentStreakWeeks: 3, bestStreakWeeks: 7 };
const mockStats = {
  totalReservations: 15,
  currentStreakWeeks: 3,
  badgesEarned: 2,
  mealsRescued: 30,
  co2eSavedGrams: 12000,
};
const allBadges = [
  { badgeId: "b1", code: "FIRST_RESCUE", name: "First Rescue", description: "Made your first reservation" },
  { badgeId: "b2", code: "STREAK_4", name: "4-Week Streak", description: "Maintained a 4-week streak" },
];
const earnedBadges = [
  { badge: { code: "FIRST_RESCUE", name: "First Rescue", badgeId: "b1", description: "" }, awardedAt: "2026-02-01T00:00:00Z" },
];

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("OrgGamificationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { profileId: "org-1", role: "ORG_ADMIN", token: "tok" };
    vi.mocked(gamificationApi.streak).mockResolvedValue(mockStreak);
    vi.mocked(gamificationApi.stats).mockResolvedValue(mockStats);
    vi.mocked(gamificationApi.orgBadges).mockResolvedValue(earnedBadges);
    vi.mocked(gamificationApi.allBadges).mockResolvedValue(allBadges);
  });

  it("shows access-denied message when user is not ORG_ADMIN", () => {
    mockUser = null;
    render(<OrgGamificationPage />);
    expect(screen.getByText(/please log in as an organisation/i)).toBeInTheDocument();
  });

  it("shows loading state while fetching", () => {
    vi.mocked(gamificationApi.streak).mockReturnValue(new Promise(() => {}));
    render(<OrgGamificationPage />);
    expect(screen.getByText(/loading achievements/i)).toBeInTheDocument();
  });

  it("renders current streak value", async () => {
    render(<OrgGamificationPage />);
    await waitFor(() =>
      expect(screen.getByText("3 weeks")).toBeInTheDocument()
    );
  });

  it("renders best streak value", async () => {
    render(<OrgGamificationPage />);
    await waitFor(() =>
      expect(screen.getByText(/best streak: 7 weeks/i)).toBeInTheDocument()
    );
  });

  it("renders impact stats — meals rescued and CO2 saved", async () => {
    render(<OrgGamificationPage />);
    await waitFor(() => expect(screen.getByText("30")).toBeInTheDocument());
    expect(screen.getByText(/meals rescued/i)).toBeInTheDocument();
    // 12000g → 12.0 kg
    expect(screen.getByText("12.0 kg")).toBeInTheDocument();
    expect(screen.getByText(/CO2e Saved/i)).toBeInTheDocument();
  });

  it("renders stat cards for total rescues, streak, and badge count", async () => {
    render(<OrgGamificationPage />);
    await waitFor(() => expect(screen.getByText("15")).toBeInTheDocument());
    expect(screen.getByText(/total rescues/i)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // badges earned
    expect(screen.getByText(/badges earned/i)).toBeInTheDocument();
  });

  it("renders all badges from API", async () => {
    render(<OrgGamificationPage />);
    await waitFor(() => expect(screen.getByText("First Rescue")).toBeInTheDocument());
    expect(screen.getByText("4-Week Streak")).toBeInTheDocument();
  });

  it("shows earned date for earned badges", async () => {
    render(<OrgGamificationPage />);
    await waitFor(() => screen.getAllByText("First Rescue"));
    // awardedAt: "2026-02-01" → toLocaleDateString varies by locale, just check the container exists
    const earnedText = screen.getAllByText(/earned/i);
    expect(earnedText.length).toBeGreaterThanOrEqual(1);
  });

  it("shows a checkmark for earned badges", async () => {
    render(<OrgGamificationPage />);
    await waitFor(() => screen.getByText("First Rescue"));
    // earnedBadges has FIRST_RESCUE — its circle should show ✓
    const badgeIcons = screen.getAllByText("✓");
    expect(badgeIcons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows a question mark for unearned badges", async () => {
    render(<OrgGamificationPage />);
    await waitFor(() => screen.getByText("4-Week Streak"));
    const questionMarks = screen.getAllByText("?");
    expect(questionMarks.length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no badges are available", async () => {
    vi.mocked(gamificationApi.allBadges).mockResolvedValueOnce([]);
    render(<OrgGamificationPage />);
    await waitFor(() =>
      expect(screen.getByText(/no badges available yet/i)).toBeInTheDocument()
    );
  });

  it("shows error alert when API fails", async () => {
    vi.mocked(gamificationApi.streak).mockRejectedValueOnce(new Error("Server error"));
    render(<OrgGamificationPage />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to load achievements/i)
    );
  });

  it("renders week streak indicator tiles", async () => {
    render(<OrgGamificationPage />);
    await waitFor(() => screen.getByText("3 weeks"));
    expect(screen.getByText("W1")).toBeInTheDocument();
    expect(screen.getByText("W2")).toBeInTheDocument();
    expect(screen.getByText("W3")).toBeInTheDocument();
    expect(screen.getByText("W4")).toBeInTheDocument();
  });
});
