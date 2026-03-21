import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(public)/login/page";

// ── Auth store mock ──────────────────────────────────────────────────────────
const mockLogin = vi.fn();
const mockInit = vi.fn();

vi.mock("@/store/auth.store", () => ({
  useAuth: () => ({
    user: null,
    login: mockLogin,
    init: mockInit,
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────
function setup() {
  const user = userEvent.setup();
  const utils = render(<LoginPage />);
  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const submitBtn = screen.getByRole("button", { name: /login/i });
  return { user, emailInput, passwordInput, submitBtn, ...utils };
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering
  it("renders the login form", () => {
    setup();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  it("calls init on mount", () => {
    setup();
    expect(mockInit).toHaveBeenCalledOnce();
  });

  // Validation — empty fields
  it("shows error when fields are empty and form is submitted", async () => {
    const { user, submitBtn } = setup();
    await user.click(submitBtn);
    expect(screen.getByRole("alert")).toHaveTextContent(/all fields are required/i);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  // Validation — short password
  it("shows error when password is fewer than 6 characters", async () => {
    const { user, emailInput, passwordInput, submitBtn } = setup();
    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput, "abc");
    await user.click(submitBtn);
    expect(screen.getByRole("alert")).toHaveTextContent(/at least 6 characters/i);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  // Validation — invalid email
  it("shows error for an invalid email format", async () => {
    const { user, emailInput, passwordInput, submitBtn } = setup();
    await user.type(emailInput, "notanemail@nodot");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);
    expect(screen.getByRole("alert")).toHaveTextContent(/invalid email/i);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  // Happy path — org login
  it("calls login with ORG_ADMIN role when seller checkbox is unchecked", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const { user, emailInput, passwordInput, submitBtn } = setup();
    await user.type(emailInput, "org@example.com");
    await user.type(passwordInput, "securepass");
    await user.click(submitBtn);
    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith("org@example.com", "securepass", "ORG_ADMIN")
    );
  });

  // Happy path — seller login
  it("calls login with SELLER role when seller checkbox is checked", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const { user, emailInput, passwordInput, submitBtn } = setup();
    const sellerCheckbox = screen.getByLabelText(/i am a seller/i);
    await user.click(sellerCheckbox);
    await user.type(emailInput, "seller@example.com");
    await user.type(passwordInput, "securepass");
    await user.click(submitBtn);
    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith("seller@example.com", "securepass", "SELLER")
    );
  });

  // Loading state
  it("disables the submit button while logging in", async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})); // never resolves
    const { user, emailInput, passwordInput, submitBtn } = setup();
    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent(/signing in/i);
  });

  // API error
  it("shows error message when login API call fails", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));
    const { user, emailInput, passwordInput, submitBtn } = setup();
    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitBtn);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/invalid credentials/i)
    );
  });
});
