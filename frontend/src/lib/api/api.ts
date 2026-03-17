const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await response.text());
  }

  return response.json();
}

// Auth
export const authApi = {
  register: (data: { email: string; password: string; role: 'SELLER' | 'ORG_ADMIN'; businessName: string; location?: string }) =>
    fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string; role?: 'SELLER' | 'ORG_ADMIN' }) =>
    fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  me: (token: string) =>
    fetchApi('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
};

// Bundles
export const bundlesApi = {
  list: () => fetchApi('/bundles'),

  getById: (id: string) => fetchApi(`/bundles/${id}`),

  bySeller: (sellerId: string, token: string) =>
    fetchApi(`/bundles/seller/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  create: (data: {
    title: string;
    description?: string;
    categoryId?: string;
    pickupStartAt: string;
    pickupEndAt: string;
    quantityTotal: number;
    priceCents: number;
    discountPct?: number;
    allergensText?: string;
    activate?: boolean;
  }, token: string) =>
    fetchApi('/bundles', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  update: (id: string, data: { title?: string; description?: string; quantityTotal?: number; priceCents?: number; discountPct?: number; allergensText?: string }, token: string) =>
    fetchApi(`/bundles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  activate: (id: string, token: string) =>
    fetchApi(`/bundles/${id}/activate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  close: (id: string, token: string) =>
    fetchApi(`/bundles/${id}/close`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Orders (org places orders for bundles)
export const ordersApi = {
  create: (data: { postingId: string; orgId: string; quantity?: number }, token: string) =>
    fetchApi('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  byOrg: (orgId: string, token: string) =>
    fetchApi(`/orders/org/${orgId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  bySeller: (sellerId: string, token: string) =>
    fetchApi(`/orders/seller/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  collect: (id: string, claimCode: string, token: string) =>
    fetchApi(`/orders/${id}/collect`, {
      method: 'POST',
      body: JSON.stringify({ claimCode }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  cancel: (id: string, token: string) =>
    fetchApi(`/orders/${id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Analytics (for sellers)
export const analyticsApi = {
  dashboard: (sellerId: string, token: string) =>
    fetchApi(`/analytics/dashboard/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  sellThrough: (sellerId: string, token: string) =>
    fetchApi(`/analytics/sell-through/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  pricing: (sellerId: string, token: string) =>
    fetchApi(`/analytics/pricing/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  popularWindows: (sellerId: string, token: string) =>
    fetchApi(`/analytics/popular-windows/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  popularCategories: (sellerId: string, token: string) =>
    fetchApi(`/analytics/popular-categories/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  wasteAvoided: (sellerId: string, token: string) =>
    fetchApi(`/analytics/waste-avoided/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Gamification (for orgs)
export const gamificationApi = {
  streak: (orgId: string, token: string) =>
    fetchApi(`/gamification/streak/${orgId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  stats: (orgId: string, token: string) =>
    fetchApi(`/gamification/stats/${orgId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  orgBadges: (orgId: string, token: string) =>
    fetchApi(`/gamification/badges/${orgId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  allBadges: () => fetchApi('/gamification/badges'),
};

// Issues
export const issuesApi = {
  bySeller: (sellerId: string, token: string) =>
    fetchApi(`/issues/seller/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  openBySeller: (sellerId: string, token: string) =>
    fetchApi(`/issues/seller/${sellerId}/open`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  byOrg: (orgId: string, token: string) =>
    fetchApi(`/issues/org/${orgId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  create: (data: { orderId?: string; orgId: string; type: 'UNAVAILABLE' | 'QUALITY' | 'OTHER'; description: string }, token: string) =>
    fetchApi('/issues', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  respond: (id: string, data: { response: string; resolve?: boolean }, token: string) =>
    fetchApi(`/issues/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  resolve: (id: string, token: string) =>
    fetchApi(`/issues/${id}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Categories
export const categoriesApi = {
  list: () => fetchApi('/categories'),
};

// Forecasting
export const forecastApi = {
  history: (sellerId: string, token: string) =>
    fetchApi(`/forecast/history/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  results: (sellerId: string, token: string) =>
    fetchApi(`/forecast/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  comparison: (sellerId: string, token: string) =>
    fetchApi(`/forecast/comparison/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  recommendations: (sellerId: string, token: string) =>
    fetchApi(`/forecast/recommendations/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  run: (sellerId: string, token: string) =>
    fetchApi(`/forecast/run/${sellerId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  metrics: (sellerId: string, token: string) =>
    fetchApi(`/forecast/metrics/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  evaluate: (sellerId: string, token: string) =>
    fetchApi(`/forecast/evaluate/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
