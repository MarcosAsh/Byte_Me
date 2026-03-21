import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SellerAnalyticsPage from "@/app/(seller)/analytics/page";
import { forecastApi } from "@/lib/api/api";
import type {
  DemandObservationResponse,
  ForecastOutputResponse,
  ForecastRunResponse,
  RecommendationResponse,
} from "@/lib/api/types";

// ── API mock ──────────────────────────────────────────────────────────────────
vi.mock("@/lib/api/api", () => ({
  forecastApi: {
    history: vi.fn(),
    results: vi.fn(),
    comparison: vi.fn(),
    recommendations: vi.fn(),
    run: vi.fn(),
  },
}));

// ── Recharts stub — avoids SVG rendering issues in jsdom ──────────────────────
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

// ── Auth store helpers ────────────────────────────────────────────────────────
let mockUser: { profileId: string; role: string; token: string } | null = null;

vi.mock("@/store/auth.store", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockHistory: DemandObservationResponse[] = [
  {
    obsId: "obs1",
    date: "2026-03-01",
    dayOfWeek: 6,
    categoryName: "Bakery",
    windowLabel: "09:00-11:00",
    discountPct: 20,
    weatherFlag: false,
    observedReservations: 4,
    observedNoShowRate: 0.1,
  },
];

const mockForecasts: ForecastOutputResponse[] = [
  {
    outputId: "f1",
    modelName: "ema_chosen",
    postingId: "p1",
    postingTitle: "Bakery Box",
    predictedReservations: 3.5,
    predictedNoShowProb: 0.12,
    confidence: 0.85,
    rationaleText: "Based on recent trends",
  },
];

const mockRuns: ForecastRunResponse[] = [
  {
    runId: "r1",
    modelName: "ema_chosen",
    trainedAt: "2026-03-10T00:00:00Z",
    trainStart: "2026-01-01",
    trainEnd: "2026-03-01",
    evalStart: "2026-03-01",
    evalEnd: "2026-03-10",
    metricsJson: JSON.stringify({ MAE_reservations: 0.8, RMSE_reservations: 1.1, Brier_no_show: 0.09 }),
  },
  {
    runId: "r2",
    modelName: "baseline",
    trainedAt: "2026-03-10T00:00:00Z",
    trainStart: "2026-01-01",
    trainEnd: "2026-03-01",
    evalStart: "2026-03-01",
    evalEnd: "2026-03-10",
    metricsJson: JSON.stringify({ MAE_reservations: 1.4, RMSE_reservations: 1.9, Brier_no_show: 0.18 }),
  },
];

const mockRecommendations: RecommendationResponse[] = [
  {
    postingId: "p1",
    postingTitle: "Bakery Box",
    currentQuantity: 5,
    recommendedQuantity: 4,
    predictedReservations: 3.5,
    noShowProb: 0.12,
    confidence: 0.85,
    rationale: "EMA model predicts slight reduction",
    recommendation: "Consider reducing quantity to 4 to minimise waste.",
  },
];

function setupMocks() {
  vi.mocked(forecastApi.history).mockResolvedValue(mockHistory);
  vi.mocked(forecastApi.results).mockResolvedValue(mockForecasts);
  vi.mocked(forecastApi.comparison).mockResolvedValue(mockRuns);
  vi.mocked(forecastApi.recommendations).mockResolvedValue(mockRecommendations);
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("SellerAnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { profileId: "seller-1", role: "SELLER", token: "tok" };
  });

  it("shows access-denied message when user is not a seller", () => {
    mockUser = null;
    render(<SellerAnalyticsPage />);
    expect(screen.getByText(/please log in as a seller/i)).toBeInTheDocument();
  });

  it("shows loading state while fetching", () => {
    vi.mocked(forecastApi.history).mockReturnValue(new Promise(() => {}));
    vi.mocked(forecastApi.results).mockReturnValue(new Promise(() => {}));
    vi.mocked(forecastApi.comparison).mockReturnValue(new Promise(() => {}));
    vi.mocked(forecastApi.recommendations).mockReturnValue(new Promise(() => {}));
    render(<SellerAnalyticsPage />);
    expect(screen.getByText(/loading forecast data/i)).toBeInTheDocument();
  });

  it("renders page heading and subtitle", async () => {
    setupMocks();
    render(<SellerAnalyticsPage />);
    await waitFor(() =>
      expect(screen.getByText(/demand forecasting/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/forecast demand, compare models/i)).toBeInTheDocument();
  });

  it("renders link to forecast evaluation report", async () => {
    setupMocks();
    render(<SellerAnalyticsPage />);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /view model evaluation report/i })).toBeInTheDocument()
    );
  });

  it("renders Run Forecast button", async () => {
    setupMocks();
    render(<SellerAnalyticsPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /run forecast/i })).toBeInTheDocument()
    );
  });

  // Demand History
  it("shows empty state when there is no demand history", async () => {
    vi.mocked(forecastApi.history).mockResolvedValue([]);
    vi.mocked(forecastApi.results).mockResolvedValue([]);
    vi.mocked(forecastApi.comparison).mockResolvedValue([]);
    vi.mocked(forecastApi.recommendations).mockResolvedValue([]);
    render(<SellerAnalyticsPage />);
    await waitFor(() =>
      expect(screen.getByText(/no historical demand data/i)).toBeInTheDocument()
    );
  });

  it("renders demand history chart when data is available", async () => {
    setupMocks();
    render(<SellerAnalyticsPage />);
    await waitFor(() =>
      expect(screen.getByText(/demand history/i)).toBeInTheDocument()
    );
    // Chart renders (stubbed) — section should not show empty state
    expect(screen.queryByText(/no historical demand data/i)).not.toBeInTheDocument();
  });

  // Forecast Predictions
  it("shows empty state when no forecasts exist", async () => {
    vi.mocked(forecastApi.history).mockResolvedValue([]);
    vi.mocked(forecastApi.results).mockResolvedValue([]);
    vi.mocked(forecastApi.comparison).mockResolvedValue([]);
    vi.mocked(forecastApi.recommendations).mockResolvedValue([]);
    render(<SellerAnalyticsPage />);
    await waitFor(() =>
      expect(screen.getByText(/no predictions yet/i)).toBeInTheDocument()
    );
  });

  it("renders forecast prediction rows for chosen models", async () => {
    setupMocks();
    render(<SellerAnalyticsPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /forecast predictions/i })).toBeInTheDocument()
    );
    const section = screen.getByRole("heading", { name: /forecast predictions/i })
      .closest(".card") as HTMLElement;
    expect(within(section).getByText("Bakery Box")).toBeInTheDocument();
    expect(within(section).getByText("3.5")).toBeInTheDocument();
  });

  // Model Comparison
  it("shows empty state when no model runs exist", async () => {
    vi.mocked(forecastApi.history).mockResolvedValue([]);
    vi.mocked(forecastApi.results).mockResolvedValue([]);
    vi.mocked(forecastApi.comparison).mockResolvedValue([]);
    vi.mocked(forecastApi.recommendations).mockResolvedValue([]);
    render(<SellerAnalyticsPage />);
    await waitFor(() =>
      expect(screen.getByText(/no model runs available/i)).toBeInTheDocument()
    );
  });

  it("renders model comparison table rows", async () => {
    setupMocks();
    render(<SellerAnalyticsPage />);
    await waitFor(() =>
      expect(screen.getByText(/ema chosen \*/i)).toBeInTheDocument()
    );
    expect(screen.getByText("baseline")).toBeInTheDocument();
    expect(screen.getByText("0.8")).toBeInTheDocument();   // MAE for ema
    expect(screen.getByText("1.1")).toBeInTheDocument();   // RMSE
    expect(screen.getByText("0.09")).toBeInTheDocument();  // Brier
  });

  it("marks the chosen model with an asterisk", async () => {
    setupMocks();
    render(<SellerAnalyticsPage />);
    await waitFor(() =>
      expect(screen.getByText(/ema chosen \*/i)).toBeInTheDocument()
    );
  });

  // Recommendations
  it("shows empty state when no recommendations exist", async () => {
    vi.mocked(forecastApi.history).mockResolvedValue([]);
    vi.mocked(forecastApi.results).mockResolvedValue([]);
    vi.mocked(forecastApi.comparison).mockResolvedValue([]);
    vi.mocked(forecastApi.recommendations).mockResolvedValue([]);
    render(<SellerAnalyticsPage />);
    await waitFor(() =>
      expect(screen.getByText(/no recommendations yet/i)).toBeInTheDocument()
    );
  });

  it("renders recommendation cards with posting title and advice", async () => {
    setupMocks();
    render(<SellerAnalyticsPage />);
    await waitFor(() =>
      expect(screen.getByText("Consider reducing quantity to 4 to minimise waste.")).toBeInTheDocument()
    );
    expect(screen.getByText(/current:/i)).toBeInTheDocument();
    expect(screen.getByText(/recommended:/i)).toBeInTheDocument();
  });

  // Run Forecast flow
  it("shows 'Running...' and disables button while forecast is running", async () => {
    setupMocks();
    vi.mocked(forecastApi.run).mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<SellerAnalyticsPage />);
    const btn = await screen.findByRole("button", { name: /run forecast/i });
    await user.click(btn);
    expect(screen.getByRole("button", { name: /running/i })).toBeDisabled();
  });

  it("reloads data after forecast run completes", async () => {
    setupMocks();
    vi.mocked(forecastApi.run).mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<SellerAnalyticsPage />);
    const btn = await screen.findByRole("button", { name: /run forecast/i });
    await user.click(btn);
    await waitFor(() =>
      expect(forecastApi.history).toHaveBeenCalledTimes(2)
    );
  });

  it("shows error alert when forecast run fails", async () => {
    setupMocks();
    vi.mocked(forecastApi.run).mockRejectedValueOnce(new Error("Run failed"));
    const user = userEvent.setup();
    render(<SellerAnalyticsPage />);
    const btn = await screen.findByRole("button", { name: /run forecast/i });
    await user.click(btn);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to run forecast/i)
    );
  });

  it("shows error alert when initial data load fails", async () => {
    vi.mocked(forecastApi.history).mockRejectedValueOnce(new Error("Server error"));
    vi.mocked(forecastApi.results).mockResolvedValue([]);
    vi.mocked(forecastApi.comparison).mockResolvedValue([]);
    vi.mocked(forecastApi.recommendations).mockResolvedValue([]);
    render(<SellerAnalyticsPage />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to load forecast data/i)
    );
  });
});
