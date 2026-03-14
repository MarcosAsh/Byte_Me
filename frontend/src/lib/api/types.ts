// Auth
export type UserRole = 'SELLER' | 'ORG_ADMIN';

export interface AuthResponse {
  token: string;
  userId: string;
  profileId: string; // sellerId or orgId depending on role
  email: string;
  role: UserRole;
}

// Seller
export interface Seller {
  sellerId: string;
  name: string;
  locationText?: string;
  openingHoursText?: string;
  contactStub?: string;
  createdAt: string;
}

// Organisation
export interface Organisation {
  orgId: string;
  name: string;
  locationText?: string;
  billingEmail?: string;
  currentStreakWeeks: number;
  bestStreakWeeks: number;
  lastOrderWeekStart?: string;
  totalOrders: number;
  createdAt: string;
}

// Category
export interface Category {
  categoryId: string;
  name: string;
}

// Bundle
export type PostingStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';

export interface BundlePosting {
  postingId: string;
  seller: Seller;
  category?: Category;
  title: string;
  description?: string;
  pickupStartAt: string;
  pickupEndAt: string;
  quantityTotal: number;
  quantityReserved: number;
  priceCents: number;
  discountPct: number;
  allergensText?: string;
  status: PostingStatus;
  createdAt: string;
}

// Order
export type OrderStatus = 'RESERVED' | 'COLLECTED' | 'CANCELLED' | 'EXPIRED';

export interface OrgOrder {
  orderId: string;
  organisation: Organisation;
  posting: BundlePosting;
  quantity: number;
  totalPriceCents: number;
  status: OrderStatus;
  reservedAt: string;
  collectedAt?: string;
  cancelledAt?: string;
}

export interface OrderResponse {
  orderId: string;
  quantity: number;
  totalPriceCents: number;
  pickupStartAt: string;
  pickupEndAt: string;
  sellerName: string;
  sellerLocation?: string;
}

// Issue
export type IssueType = 'UNAVAILABLE' | 'QUALITY' | 'OTHER';
export type IssueStatus = 'OPEN' | 'RESPONDED' | 'RESOLVED';

export interface IssueReport {
  issueId: string;
  order?: OrgOrder;
  organisation?: Organisation;
  type: IssueType;
  description: string;
  status: IssueStatus;
  sellerResponse?: string;
  createdAt: string;
  resolvedAt?: string;
}

// Badge
export interface Badge {
  badgeId: string;
  code: string;
  name: string;
  description?: string;
}

export interface OrganisationBadge {
  orgId: string;
  badgeId: string;
  badge: Badge;
  awardedAt: string;
}

// Gamification
export interface StreakResponse {
  currentStreakWeeks: number;
  bestStreakWeeks: number;
  lastOrderWeekStart?: string;
}

export interface StatsResponse {
  totalReservations: number;
  currentStreakWeeks: number;
  bestStreakWeeks: number;
  badgesEarned: number;
  mealsRescued: number;
  co2eSavedGrams: number;
}

// Analytics
export interface DashboardResponse {
  sellerName: string;
  totalBundlesPosted: number;
  totalQuantity: number;
  collectedCount: number;
  cancelledCount: number;
  expiredCount: number;
  sellThroughRate: number;
  openIssueCount: number;
}

export interface WasteAvoidedResponse {
  wasteAvoidedGrams: number;
  wasteAvoidedKg: number;
  co2eAvoidedKg: number;
  avgWeightPerBundleKg: number;
  totalBundlesCollected: number;
}

export interface SellThroughResponse {
  collected: number;
  cancelled: number;
  expired: number;
  collectionRate: number;
  cancelRate: number;
}

// Insights
export interface PricingRow {
  bracket: string;
  bundleCount: number;
  totalQuantity: number;
  collectedCount: number;
  sellThroughRate: number;
}

export interface WindowRow {
  windowLabel: string;
  totalReservations: number;
  collectedCount: number;
  noShowCount: number;
  collectionRate: number;
}

export interface CategoryRow {
  categoryName: string;
  bundlesPosted: number;
  totalQuantity: number;
  collectedCount: number;
  sellThroughRate: number;
}

// Forecasting
export interface DemandObservationResponse {
  obsId: string;
  date: string;
  dayOfWeek: number;
  categoryName: string;
  windowLabel: string;
  discountPct: number;
  weatherFlag: boolean;
  observedReservations: number;
  observedNoShowRate: number;
}

export interface ForecastOutputResponse {
  outputId: string;
  modelName: string;
  postingId: string;
  postingTitle: string;
  predictedReservations: number;
  predictedNoShowProb: number;
  confidence: number;
  rationaleText: string;
}

export interface ForecastRunResponse {
  runId: string;
  modelName: string;
  trainedAt: string;
  trainStart: string;
  trainEnd: string;
  evalStart: string;
  evalEnd: string;
  metricsJson: string;
}

export interface RecommendationResponse {
  postingId: string;
  postingTitle: string;
  currentQuantity: number;
  recommendedQuantity: number;
  predictedReservations: number;
  noShowProb: number;
  confidence: number;
  rationale: string;
  recommendation: string;
}

export interface WeeklyMetricsResponse {
  weekStart: string;
  postedCount: number;
  reservedCount: number;
  collectedCount: number;
  noShowCount: number;
  expiredCount: number;
  sellThroughRate: number;
  wasteAvoidedGrams: number;
}
