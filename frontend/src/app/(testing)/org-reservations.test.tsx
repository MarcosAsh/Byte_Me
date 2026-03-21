import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OrgReservationsPage from "@/app/(org)/reservations/page";
import { ordersApi } from "@/lib/api/api";

vi.mock("@/lib/api/api", () => ({
  ordersApi: { byOrg: vi.fn(), cancel: vi.fn() },
}));

vi.mock("@/components/FoodSafetyDisclaimer", () => ({
  default: () => <p>Food safety disclaimer</p>,
}));

let mockUser: { profileId: string; role: string; token: string } | null = null;

vi.mock("@/store/auth.store", () => ({
  useAuth: () => ({ user: mockUser }),
}));

const FUTURE = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
const PAST = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

const reserved = {
  reservationId: "r1",
  postingTitle: "Bakery Box",
  sellerName: "City Bakery",
  sellerLocation: "123 High St",
  priceCents: 400,
  pickupStartAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  pickupEndAt: FUTURE,
  status: "RESERVED",
  reservedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  claimCodeLast4: "7890",
};

const collected = { ...reserved, reservationId: "r2", postingTitle: "Veggie Box", status: "COLLECTED", collectedAt: PAST };
const cancelled = { ...reserved, reservationId: "r3", postingTitle: "Soup Bundle", status: "CANCELLED", cancelledAt: PAST };

describe("OrgReservationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { profileId: "org-1", role: "ORG_ADMIN", token: "tok" };
  });

  it("shows access-denied message when user is not an ORG_ADMIN", () => {
    mockUser = null;
    render(<OrgReservationsPage />);
    expect(screen.getByText(/please log in as an organisation/i)).toBeInTheDocument();
  });

  it("shows loading state while fetching", () => {
    vi.mocked(ordersApi.byOrg).mockReturnValue(new Promise(() => {}));
    render(<OrgReservationsPage />);
    expect(screen.getByText(/loading reservations/i)).toBeInTheDocument();
  });

  it("renders reservation cards after loading", async () => {
    vi.mocked(ordersApi.byOrg).mockResolvedValueOnce([reserved, collected, cancelled]);
    render(<OrgReservationsPage />);
    await waitFor(() => expect(screen.getAllByText("Bakery Box").length).toBeGreaterThanOrEqual(1));
    expect(screen.getByText("Veggie Box")).toBeInTheDocument();
    expect(screen.getByText("Soup Bundle")).toBeInTheDocument();
  });

  it("shows food safety disclaimer", async () => {
    vi.mocked(ordersApi.byOrg).mockResolvedValueOnce([]);
    render(<OrgReservationsPage />);
    await waitFor(() => expect(screen.getByText(/food safety disclaimer/i)).toBeInTheDocument());
  });

  it("shows empty state with Browse Bundles link when there are no reservations", async () => {
    vi.mocked(ordersApi.byOrg).mockResolvedValueOnce([]);
    render(<OrgReservationsPage />);
    await waitFor(() => expect(screen.getByText(/you haven't made any reservations yet/i)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /browse bundles/i })).toBeInTheDocument();
  });

  it("shows error alert when API fails", async () => {
    vi.mocked(ordersApi.byOrg).mockRejectedValueOnce(new Error("Network error"));
    render(<OrgReservationsPage />);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/failed to load reservations/i));
  });

  it("renders status filter tabs", async () => {
    vi.mocked(ordersApi.byOrg).mockResolvedValueOnce([reserved]);
    render(<OrgReservationsPage />);
    await waitFor(() => screen.getAllByText("Bakery Box"));
    ["All", "Reserved", "Collected", "Cancelled", "Expired"].forEach((label) => {
      expect(screen.getByRole("button", { name: new RegExp(label, "i") })).toBeInTheDocument();
    });
  });

  it("filters to show only collected reservations when COLLECTED tab clicked", async () => {
    vi.mocked(ordersApi.byOrg).mockResolvedValueOnce([reserved, collected, cancelled]);
    const user = userEvent.setup();
    render(<OrgReservationsPage />);
    await waitFor(() => screen.getAllByText("Bakery Box"));
    await user.click(screen.getByRole("button", { name: /^collected/i }));
    expect(screen.getAllByText("Bakery Box").length).toBe(1);
    expect(screen.getByText("Veggie Box")).toBeInTheDocument();
    expect(screen.queryByText("Soup Bundle")).not.toBeInTheDocument();
  });

  it("shows pickup reminder for upcoming RESERVED reservations", async () => {
    vi.mocked(ordersApi.byOrg).mockResolvedValueOnce([reserved]);
    render(<OrgReservationsPage />);
    await waitFor(() => expect(screen.getByText(/upcoming pickups/i)).toBeInTheDocument());
    expect(screen.getAllByText(/7890/).length).toBeGreaterThanOrEqual(1);
  });

  it("does not show pickup reminder when no upcoming reservations", async () => {
    vi.mocked(ordersApi.byOrg).mockResolvedValueOnce([collected]);
    render(<OrgReservationsPage />);
    await waitFor(() => screen.getByText("Veggie Box"));
    expect(screen.queryByText(/upcoming pickups/i)).not.toBeInTheDocument();
  });

  it("shows Cancel button for upcoming RESERVED reservations", async () => {
    vi.mocked(ordersApi.byOrg).mockResolvedValueOnce([reserved]);
    render(<OrgReservationsPage />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument());
  });

  it("calls ordersApi.cancel and reloads when cancel is confirmed", async () => {
    vi.mocked(ordersApi.byOrg)
      .mockResolvedValueOnce([reserved])
      .mockResolvedValueOnce([{ ...reserved, status: "CANCELLED" }]);
    vi.mocked(ordersApi.cancel).mockResolvedValueOnce({});
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    const user = userEvent.setup();
    render(<OrgReservationsPage />);
    await waitFor(() => screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(ordersApi.cancel).toHaveBeenCalledWith("r1", "tok"));
    expect(ordersApi.byOrg).toHaveBeenCalledTimes(2);
  });

  it("does not cancel when confirm dialog is dismissed", async () => {
    vi.mocked(ordersApi.byOrg).mockResolvedValueOnce([reserved]);
    vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    const user = userEvent.setup();
    render(<OrgReservationsPage />);
    await waitFor(() => screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(ordersApi.cancel).not.toHaveBeenCalled();
  });

  it("shows error alert when cancel fails", async () => {
    vi.mocked(ordersApi.byOrg).mockResolvedValueOnce([reserved]);
    vi.mocked(ordersApi.cancel).mockRejectedValueOnce(new Error("Cancel failed"));
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    const user = userEvent.setup();
    render(<OrgReservationsPage />);
    await waitFor(() => screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to cancel reservation/i)
    );
  });
});
