const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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

//auth
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  
  login: (data: { email: string; password: string }) =>
    fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  
  me: (token: string) =>
    fetchApi('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
};

//bundles
export const bundlesApi = {
  list: () => fetchApi('/bundles'),
  
  getById: (id: string) => fetchApi(`/bundles/${id}`),
  
  create: (data: any, token: string) =>
    fetchApi('/bundles', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  update: (id: string, data: any, token: string) =>
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

//reservations
export const reservationsApi = {
  reserve: (data: any, token: string) =>
    fetchApi('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  byOrg: (orgId: string, token: string) =>
    fetchApi(`/reservations/org/${orgId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  byEmployee: (employeeId: string, token: string) =>
    fetchApi(`/reservations/employee/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  verify: (id: string, code: string, token: string) =>
    fetchApi(`/reservations/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ code }),
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  noShow: (id: string, token: string) =>
    fetchApi(`/reservations/${id}/no-show`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  cancel: (id: string, token: string) =>
    fetchApi(`/reservations/${id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  assign: (id: string, employeeId: string, token: string) =>
    fetchApi(`/reservations/${id}/assign/${employeeId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
};

//analytics
export const analyticsApi = {
  dashboard: (sellerId: string, token: string) =>
    fetchApi(`/analytics/dashboard/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  sellThrough: (sellerId: string, token: string) =>
    fetchApi(`/analytics/sell-through/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  waste: (sellerId: string, token: string) =>
    fetchApi(`/analytics/waste/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

//gamification
export const gamificationApi = {
  streak: (employeeId: string, token: string) =>
    fetchApi(`/gamification/streak/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  impact: (employeeId: string, token: string) =>
    fetchApi(`/gamification/impact/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  employeeBadges: (employeeId: string, token: string) =>
    fetchApi(`/gamification/badges/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  allBadges: () => fetchApi('/gamification/badges'),
};

//issues
export const issuesApi = {
  bySeller: (sellerId: string, token: string) =>
    fetchApi(`/issues/seller/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  openBySeller: (sellerId: string, token: string) =>
    fetchApi(`/issues/seller/${sellerId}/open`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  create: (data: any, token: string) =>
    fetchApi('/issues', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  respond: (id: string, data: any, token: string) =>
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

//categories
export const categoriesApi = {
  list: () => fetchApi('/categories'),
};