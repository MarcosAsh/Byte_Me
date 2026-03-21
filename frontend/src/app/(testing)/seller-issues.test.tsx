import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SellerIssuesPage from "@/app/(seller)/issues/page";
import { issuesApi } from "@/lib/api/api";
import type { IssueReport } from "@/lib/api/types";

// ── API mock ──────────────────────────────────────────────────────────────────
vi.mock("@/lib/api/api", () => ({
  issuesApi: {
    bySeller: vi.fn(),
    respond: vi.fn(),
    resolve: vi.fn(),
  },
}));

// ── Auth store helpers ────────────────────────────────────────────────────────
let mockUser: { profileId: string; role: string; token: string } | null = null;

vi.mock("@/store/auth.store", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const openIssue: IssueReport = {
  issueId: "i1",
  type: "QUALITY",
  description: "The bread was stale",
  status: "OPEN",
  createdAt: "2026-03-18T08:00:00Z",
  organisation: { orgId: "org-1", name: "Food Bank A", currentStreakWeeks: 0, bestStreakWeeks: 0, totalOrders: 0, createdAt: "" },
};

const respondedIssue: IssueReport = {
  issueId: "i2",
  type: "UNAVAILABLE",
  description: "Bundle was not ready",
  status: "RESPONDED",
  createdAt: "2026-03-17T08:00:00Z",
  sellerResponse: "We apologise for the inconvenience.",
  organisation: { orgId: "org-2", name: "Shelter B", currentStreakWeeks: 0, bestStreakWeeks: 0, totalOrders: 0, createdAt: "" },
};

const resolvedIssue: IssueReport = {
  issueId: "i3",
  type: "OTHER",
  description: "Wrong items included",
  status: "RESOLVED",
  createdAt: "2026-03-16T08:00:00Z",
  resolvedAt: "2026-03-17T08:00:00Z",
  organisation: { orgId: "org-3", name: "Community Hub", currentStreakWeeks: 0, bestStreakWeeks: 0, totalOrders: 0, createdAt: "" },
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("SellerIssuesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { profileId: "seller-1", role: "SELLER", token: "tok" };
  });

  // Access guard
  it("shows access-denied message when user is not a seller", () => {
    mockUser = null;
    render(<SellerIssuesPage />);
    expect(screen.getByText(/please log in as a seller/i)).toBeInTheDocument();
  });

  it("shows access-denied message when user is ORG_ADMIN", () => {
    mockUser = { profileId: "org-1", role: "ORG_ADMIN", token: "tok" };
    render(<SellerIssuesPage />);
    expect(screen.getByText(/please log in as a seller/i)).toBeInTheDocument();
  });

  // Loading
  it("shows loading state while fetching", () => {
    vi.mocked(issuesApi.bySeller).mockReturnValue(new Promise(() => {}));
    render(<SellerIssuesPage />);
    expect(screen.getByText(/loading issues/i)).toBeInTheDocument();
  });

  // Rendering
  it("renders page heading after loading", async () => {
    vi.mocked(issuesApi.bySeller).mockResolvedValue([openIssue]);
    render(<SellerIssuesPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /issue reports/i })).toBeInTheDocument()
    );
  });

  it("renders issue cards with description and org name", async () => {
    vi.mocked(issuesApi.bySeller).mockResolvedValue([openIssue, respondedIssue]);
    render(<SellerIssuesPage />);
    await waitFor(() => expect(screen.getByText("The bread was stale")).toBeInTheDocument());
    expect(screen.getByText("Bundle was not ready")).toBeInTheDocument();
    expect(screen.getByText(/reported by: food bank a/i)).toBeInTheDocument();
    expect(screen.getByText(/reported by: shelter b/i)).toBeInTheDocument();
  });

  it("shows existing seller response when present", async () => {
    vi.mocked(issuesApi.bySeller).mockResolvedValue([respondedIssue]);
    render(<SellerIssuesPage />);
    await waitFor(() =>
      expect(screen.getByText("We apologise for the inconvenience.")).toBeInTheDocument()
    );
  });

  it("shows resolved date for resolved issues", async () => {
    vi.mocked(issuesApi.bySeller).mockResolvedValue([resolvedIssue]);
    render(<SellerIssuesPage />);
    await waitFor(() =>
      expect(screen.getByText(/resolved on/i)).toBeInTheDocument()
    );
  });

  it("shows empty state when there are no issues", async () => {
    vi.mocked(issuesApi.bySeller).mockResolvedValue([]);
    render(<SellerIssuesPage />);
    await waitFor(() =>
      expect(screen.getByText(/no.*issues found/i)).toBeInTheDocument()
    );
  });

  it("shows error alert when API fails", async () => {
    vi.mocked(issuesApi.bySeller).mockRejectedValueOnce(new Error("Server error"));
    render(<SellerIssuesPage />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to load issues/i)
    );
  });

  // Filter tabs
  it("renders filter tabs for ALL, OPEN, RESPONDED, RESOLVED", async () => {
    vi.mocked(issuesApi.bySeller).mockResolvedValue([openIssue]);
    render(<SellerIssuesPage />);
    await waitFor(() => screen.getByText("The bread was stale"));
    expect(screen.getByRole("button", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /responded/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resolved/i })).toBeInTheDocument();
  });

  it("filters to show only OPEN issues when OPEN tab is clicked", async () => {
    vi.mocked(issuesApi.bySeller).mockResolvedValue([openIssue, resolvedIssue]);
    const user = userEvent.setup();
    render(<SellerIssuesPage />);
    await waitFor(() => screen.getByText("The bread was stale"));
    await user.click(screen.getByRole("button", { name: /^open/i }));
    expect(screen.getByText("The bread was stale")).toBeInTheDocument();
    expect(screen.queryByText("Wrong items included")).not.toBeInTheDocument();
  });

  it("shows empty state when filter has no matching issues", async () => {
    vi.mocked(issuesApi.bySeller).mockResolvedValue([openIssue]);
    const user = userEvent.setup();
    render(<SellerIssuesPage />);
    await waitFor(() => screen.getByText("The bread was stale"));
    await user.click(screen.getByRole("button", { name: /^resolved/i }));
    expect(screen.getByText(/no resolved issues found/i)).toBeInTheDocument();
  });

  // Respond flow
  it("shows Respond button for OPEN issues", async () => {
    vi.mocked(issuesApi.bySeller).mockResolvedValue([openIssue]);
    render(<SellerIssuesPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^respond$/i })).toBeInTheDocument()
    );
  });

  it("does not show Respond button for RESOLVED issues", async () => {
    vi.mocked(issuesApi.bySeller).mockResolvedValue([resolvedIssue]);
    render(<SellerIssuesPage />);
    await waitFor(() => screen.getByText("Wrong items included"));
    expect(screen.queryByRole("button", { name: /^respond$/i })).not.toBeInTheDocument();
  });

  it("shows response textarea when Respond is clicked", async () => {
    vi.mocked(issuesApi.bySeller).mockResolvedValue([openIssue]);
    const user = userEvent.setup();
    render(<SellerIssuesPage />);
    await waitFor(() => screen.getByRole("button", { name: /^respond$/i }));
    await user.click(screen.getByRole("button", { name: /^respond$/i }));
    expect(screen.getByLabelText(/response text/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send response/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /respond & resolve/i })).toBeInTheDocument();
  });

  it("calls issuesApi.respond and reloads when Send Response is clicked", async () => {
    vi.mocked(issuesApi.bySeller)
      .mockResolvedValueOnce([openIssue])
      .mockResolvedValueOnce([{ ...openIssue, status: "RESPONDED", sellerResponse: "Thank you for letting us know." }]);
    vi.mocked(issuesApi.respond).mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<SellerIssuesPage />);
    await waitFor(() => screen.getByRole("button", { name: /^respond$/i }));
    await user.click(screen.getByRole("button", { name: /^respond$/i }));
    await user.type(screen.getByLabelText(/response text/i), "Thank you for letting us know.");
    await user.click(screen.getByRole("button", { name: /send response/i }));
    await waitFor(() =>
      expect(issuesApi.respond).toHaveBeenCalledWith("i1", { response: "Thank you for letting us know.", resolve: false }, "tok")
    );
    expect(issuesApi.bySeller).toHaveBeenCalledTimes(2);
  });

  it("calls issuesApi.respond with resolve=true when Respond & Resolve is clicked", async () => {
    vi.mocked(issuesApi.bySeller).mockResolvedValue([openIssue]);
    vi.mocked(issuesApi.respond).mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<SellerIssuesPage />);
    await waitFor(() => screen.getByRole("button", { name: /^respond$/i }));
    await user.click(screen.getByRole("button", { name: /^respond$/i }));
    await user.type(screen.getByLabelText(/response text/i), "Issue resolved.");
    await user.click(screen.getByRole("button", { name: /respond & resolve/i }));
    await waitFor(() =>
      expect(issuesApi.respond).toHaveBeenCalledWith("i1", { response: "Issue resolved.", resolve: true }, "tok")
    );
  });

  it("hides textarea when Cancel is clicked in respond mode", async () => {
    vi.mocked(issuesApi.bySeller).mockResolvedValue([openIssue]);
    const user = userEvent.setup();
    render(<SellerIssuesPage />);
    await waitFor(() => screen.getByRole("button", { name: /^respond$/i }));
    await user.click(screen.getByRole("button", { name: /^respond$/i }));
    expect(screen.getByLabelText(/response text/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.queryByLabelText(/response text/i)).not.toBeInTheDocument();
  });

  // Mark Resolved
  it("shows Mark Resolved button for RESPONDED issues", async () => {
    vi.mocked(issuesApi.bySeller).mockResolvedValue([respondedIssue]);
    render(<SellerIssuesPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /mark resolved/i })).toBeInTheDocument()
    );
  });

  it("calls issuesApi.resolve and reloads when Mark Resolved is clicked", async () => {
    vi.mocked(issuesApi.bySeller)
      .mockResolvedValueOnce([respondedIssue])
      .mockResolvedValueOnce([{ ...respondedIssue, status: "RESOLVED" }]);
    vi.mocked(issuesApi.resolve).mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<SellerIssuesPage />);
    await waitFor(() => screen.getByRole("button", { name: /mark resolved/i }));
    await user.click(screen.getByRole("button", { name: /mark resolved/i }));
    await waitFor(() =>
      expect(issuesApi.resolve).toHaveBeenCalledWith("i2", "tok")
    );
    expect(issuesApi.bySeller).toHaveBeenCalledTimes(2);
  });

  it("shows error alert when respond fails", async () => {
    vi.mocked(issuesApi.bySeller).mockResolvedValue([openIssue]);
    vi.mocked(issuesApi.respond).mockRejectedValueOnce(new Error("Failed"));
    const user = userEvent.setup();
    render(<SellerIssuesPage />);
    await waitFor(() => screen.getByRole("button", { name: /^respond$/i }));
    await user.click(screen.getByRole("button", { name: /^respond$/i }));
    await user.type(screen.getByLabelText(/response text/i), "Some response");
    await user.click(screen.getByRole("button", { name: /send response/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to send response/i)
    );
  });
});
