import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateBundlePage from "@/app/(seller)/bundle/page";
import { bundlesApi, categoriesApi } from "@/lib/api/api";

// ── API mocks ─────────────────────────────────────────────────────────────────
vi.mock("@/lib/api/api", () => ({
  bundlesApi: { create: vi.fn() },
  categoriesApi: { list: vi.fn() },
}));

// ── Auth store helpers ────────────────────────────────────────────────────────
let mockUser: { profileId: string; role: string; token: string } | null = null;

vi.mock("@/store/auth.store", () => ({
  useAuth: () => ({ user: mockUser }),
}));

const mockCategories = [
  { categoryId: "c1", name: "Bakery" },
  { categoryId: "c2", name: "Produce" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^title/i), "Mixed Bakery Bag");
  await user.type(screen.getByLabelText(/pickup date/i), "2026-04-01");
  await user.type(screen.getByLabelText(/pickup start/i), "09:00");
  await user.type(screen.getByLabelText(/pickup end/i), "11:00");
  // quantity defaults to 1 — leave it
  await user.clear(screen.getByLabelText(/price/i));
  await user.type(screen.getByLabelText(/price/i), "5.00");
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("CreateBundlePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { profileId: "seller-1", role: "SELLER", token: "tok" };
    vi.mocked(categoriesApi.list).mockResolvedValue(mockCategories);
  });

  // Access guard
  it("shows access-denied message when user is not a seller", async () => {
    mockUser = null;
    vi.mocked(categoriesApi.list).mockResolvedValue([]);
    render(<CreateBundlePage />);
    await waitFor(() =>
      expect(screen.getByText(/please log in as a seller/i)).toBeInTheDocument()
    );
  });

  // Rendering
  it("renders all required form fields for a seller", async () => {
    render(<CreateBundlePage />);
    await waitFor(() => screen.getByLabelText(/^title/i));
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pickup date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pickup start/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pickup end/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/discount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/allergen/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/make active immediately/i)).toBeInTheDocument();
  });

  it("populates category dropdown from API", async () => {
    render(<CreateBundlePage />);
    await waitFor(() => screen.getByRole("option", { name: "Bakery" }));
    expect(screen.getByRole("option", { name: "Produce" })).toBeInTheDocument();
  });

  // Validation
  it("shows error when title is empty on submit", async () => {
    const user = userEvent.setup();
    render(<CreateBundlePage />);
    await waitFor(() => screen.getByLabelText(/^title/i));
    fireEvent.submit(screen.getByRole("button", { name: /post bundle/i }).closest("form")!);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/title is required/i)
    );
    expect(bundlesApi.create).not.toHaveBeenCalled();
  });

  it("shows error when pickup date/times are missing", async () => {
    const user = userEvent.setup();
    render(<CreateBundlePage />);
    await waitFor(() => screen.getByLabelText(/^title/i));
    await user.type(screen.getByLabelText(/^title/i), "Test Bundle");
    fireEvent.submit(screen.getByRole("button", { name: /post bundle/i }).closest("form")!);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/pickup date and times are required/i)
    );
  });

  it("shows error when end time is not after start time", async () => {
    const user = userEvent.setup();
    render(<CreateBundlePage />);
    await waitFor(() => screen.getByLabelText(/^title/i));
    await user.type(screen.getByLabelText(/^title/i), "Test Bundle");
    await user.type(screen.getByLabelText(/pickup date/i), "2026-04-01");
    await user.type(screen.getByLabelText(/pickup start/i), "11:00");
    await user.type(screen.getByLabelText(/pickup end/i), "09:00");
    await user.clear(screen.getByLabelText(/price/i));
    await user.type(screen.getByLabelText(/price/i), "5.00");
    await user.click(screen.getByRole("button", { name: /post bundle/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/end time must be after start time/i);
  });

  it("shows error for an invalid price", async () => {
    const user = userEvent.setup();
    render(<CreateBundlePage />);
    await waitFor(() => screen.getByLabelText(/^title/i));
    await user.type(screen.getByLabelText(/^title/i), "Test Bundle");
    await user.type(screen.getByLabelText(/pickup date/i), "2026-04-01");
    await user.type(screen.getByLabelText(/pickup start/i), "09:00");
    await user.type(screen.getByLabelText(/pickup end/i), "11:00");
    fireEvent.submit(screen.getByRole("button", { name: /post bundle/i }).closest("form")!);
    expect(screen.getByRole("alert")).toHaveTextContent(/valid price/i);
  });

  // Happy path — active
  it("calls bundlesApi.create with correct payload and shows success", async () => {
    vi.mocked(bundlesApi.create).mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<CreateBundlePage />);
    await waitFor(() => screen.getByLabelText(/^title/i));
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /post bundle/i }));
    await waitFor(() =>
      expect(screen.getByText(/bundle created successfully/i)).toBeInTheDocument()
    );
    expect(bundlesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Mixed Bakery Bag",
        priceCents: 500,
        activate: true,
      }),
      "tok"
    );
  });

  // Happy path — draft
  it("saves as draft when 'Make active immediately' is unchecked", async () => {
    vi.mocked(bundlesApi.create).mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<CreateBundlePage />);
    await waitFor(() => screen.getByLabelText(/^title/i));
    await fillValidForm(user);
    await user.click(screen.getByLabelText(/make active immediately/i));
    await user.click(screen.getByRole("button", { name: /save as draft/i }));
    await waitFor(() =>
      expect(bundlesApi.create).toHaveBeenCalledWith(
        expect.objectContaining({ activate: false }),
        "tok"
      )
    );
  });

  // Post-success actions
  it("shows 'Create Another' and 'Back to Dashboard' after success", async () => {
    vi.mocked(bundlesApi.create).mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<CreateBundlePage />);
    await waitFor(() => screen.getByLabelText(/^title/i));
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /post bundle/i }));
    await waitFor(() => screen.getByText(/bundle created successfully/i));
    expect(screen.getByRole("button", { name: /create another/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to dashboard/i })).toBeInTheDocument();
  });

  it("resets the form and hides success message when 'Create Another' is clicked", async () => {
    vi.mocked(bundlesApi.create).mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<CreateBundlePage />);
    await waitFor(() => screen.getByLabelText(/^title/i));
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /post bundle/i }));
    await waitFor(() => screen.getByRole("button", { name: /create another/i }));
    await user.click(screen.getByRole("button", { name: /create another/i }));
    expect(screen.queryByText(/bundle created successfully/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^title/i)).toHaveValue("");
  });

  // Loading state
  it("disables submit button while API call is in-flight", async () => {
    vi.mocked(bundlesApi.create).mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<CreateBundlePage />);
    await waitFor(() => screen.getByLabelText(/^title/i));
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /post bundle/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled()
    );
  });

  // API error
  it("shows error when bundle creation fails", async () => {
    vi.mocked(bundlesApi.create).mockRejectedValueOnce(new Error("Server error"));
    const user = userEvent.setup();
    render(<CreateBundlePage />);
    await waitFor(() => screen.getByLabelText(/^title/i));
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /post bundle/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to create bundle/i)
    );
  });
});
