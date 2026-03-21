import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/(public)/register/page";

// ── Auth store mock ──────────────────────────────────────────────────────────
const mockRegister = vi.fn();
const mockInit = vi.fn();

vi.mock("@/store/auth.store", () => ({
  useAuth: () => ({
    user: null,
    register: mockRegister,
    init: mockInit,
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────
function setup() {
  const user = userEvent.setup();
  const utils = render(<RegisterPage />);

  const nameInput = screen.getByLabelText(/business name/i);
  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const tcsCheckbox = screen.getByLabelText(/terms and conditions/i);
  const submitBtn = screen.getByRole("button", { name: /create account/i });

  // Fill T&Cs by default — most tests need them accepted
  const fillValid = async () => {
    await user.type(nameInput, "Test Org");
    await user.type(emailInput, "org@example.com");
    await user.type(passwordInput, "password123");
    await user.click(tcsCheckbox);
  };

  return { user, nameInput, emailInput, passwordInput, tcsCheckbox, submitBtn, fillValid, ...utils };
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe("RegisterPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders all required form fields", () => {
    setup();
    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i am a seller/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/terms and conditions/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("calls init on mount", () => {
    setup();
    expect(mockInit).toHaveBeenCalledOnce();
  });

  it("shows error when T&Cs are not accepted", async () => {
    const { user, nameInput, emailInput, passwordInput, submitBtn } = setup();
    await user.type(nameInput, "Test Org");
    await user.type(emailInput, "org@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);
    expect(screen.getByRole("alert")).toHaveTextContent(/terms and conditions/i);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("shows error when required fields are empty", async () => {
    const { user, tcsCheckbox, submitBtn } = setup();
    await user.click(tcsCheckbox);
    await user.click(submitBtn);
    expect(screen.getByRole("alert")).toHaveTextContent(/all fields are required/i);
  });

  it("shows error when password is fewer than 6 characters", async () => {
    const { user, nameInput, emailInput, passwordInput, tcsCheckbox, submitBtn } = setup();
    await user.type(nameInput, "Test Org");
    await user.type(emailInput, "org@example.com");
    await user.type(passwordInput, "abc");
    await user.click(tcsCheckbox);
    await user.click(submitBtn);
    expect(screen.getByRole("alert")).toHaveTextContent(/at least 6 characters/i);
  });

  it("shows error for an invalid email format", async () => {
    const { user, nameInput, emailInput, passwordInput, tcsCheckbox, submitBtn } = setup();
    await user.type(nameInput, "Test Org");
    await user.type(emailInput, "notvalid@nodot");
    await user.type(passwordInput, "password123");
    await user.click(tcsCheckbox);
    await user.click(submitBtn);
    expect(screen.getByRole("alert")).toHaveTextContent(/invalid email/i);
  });

  it("registers as ORG_ADMIN by default", async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const { user, fillValid, submitBtn } = setup();
    await fillValid();
    await user.click(submitBtn);
    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith(
        "org@example.com",
        "password123",
        "ORG_ADMIN",
        "Test Org",
        undefined
      )
    );
  });

  it("registers as SELLER when seller checkbox is checked", async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const { user, fillValid, submitBtn } = setup();
    await fillValid();
    await user.click(screen.getByLabelText(/i am a seller/i));
    await user.click(submitBtn);
    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith(
        "org@example.com",
        "password123",
        "SELLER",
        "Test Org",
        undefined
      )
    );
  });

  it("passes the optional location field when filled", async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const { user, fillValid, submitBtn } = setup();
    await fillValid();
    await user.type(screen.getByLabelText(/location/i), "London");
    await user.click(submitBtn);
    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith(
        "org@example.com",
        "password123",
        "ORG_ADMIN",
        "Test Org",
        "London"
      )
    );
  });

  it("disables the submit button while request is in-flight", async () => {
    mockRegister.mockImplementation(() => new Promise(() => {}));
    const { user, fillValid, submitBtn } = setup();
    await fillValid();
    await user.click(submitBtn);
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent(/creating account/i);
  });

  it("shows API error when registration fails", async () => {
    mockRegister.mockRejectedValueOnce(new Error("Email already in use"));
    const { user, fillValid, submitBtn } = setup();
    await fillValid();
    await user.click(submitBtn);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/email already in use/i)
    );
  });
});
