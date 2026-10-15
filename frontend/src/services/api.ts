import {
  ApiResponse,
  AuthResponse,
  Baggage,
  BaggageException,
  BaggageMovement,
  BaggageRegistrationRequest,
  BaggageTransitionRequest,
  DatabaseHealth,
  Flight,
  HandlingPoint,
  RouteCalculationRequest,
  RouteResponse,
  ScannerEventRequest,
  ScanResultResponse,
  AnalyticsSummary,
  SystemSetting,
  WarehouseRefreshResponse,
  User,
} from '../types';

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('aerotrace_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Operational request failed');
  }

  return json.data;
}

export const api = {
  // Auth
  getDemoSession: async (): Promise<AuthResponse> => {
    return request<AuthResponse>('/auth/demo-session');
  },

  login: async (username: string, password: string): Promise<AuthResponse> => {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  // Dashboard
  getDashboardSummary: async (): Promise<{
    operationalMetrics: AnalyticsSummary;
    databaseHealth: DatabaseHealth;
    recentActivity: BaggageMovement[];
  }> => {
    return request('/dashboard/summary');
  },

  // Baggage
  registerBaggage: async (data: BaggageRegistrationRequest): Promise<Baggage> => {
    return request<Baggage>('/baggage/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getBaggageByTag: async (tag: string): Promise<Baggage> => {
    return request<Baggage>(`/baggage/${encodeURIComponent(tag)}`);
  },

  transitionBaggage: async (tag: string, data: BaggageTransitionRequest): Promise<Baggage> => {
    return request<Baggage>(`/baggage/${encodeURIComponent(tag)}/transition`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  searchBaggage: async (query?: string, status?: string, flightId?: number, page = 0, size = 20): Promise<{ content: Baggage[]; totalElements: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (status) params.append('status', status);
    if (flightId) params.append('flightId', flightId.toString());
    params.append('page', page.toString());
    params.append('size', size.toString());

    return request(`/baggage/search?${params.toString()}`);
  },

  // Scans
  submitScan: async (data: ScannerEventRequest): Promise<ScanResultResponse> => {
    return request<ScanResultResponse>('/scans/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getRecentScans: async (): Promise<BaggageMovement[]> => {
    return request<BaggageMovement[]>('/scans/recent');
  },

  // Routes
  calculateRoute: async (data: RouteCalculationRequest): Promise<RouteResponse> => {
    return request<RouteResponse>('/routes/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTopology: async (): Promise<any[]> => {
    return request('/routes/topology');
  },

  // Flights
  getFlights: async (): Promise<Flight[]> => {
    return request<Flight[]>('/flights');
  },

  getFlightById: async (id: number): Promise<Flight> => {
    return request<Flight>(`/flights/${id}`);
  },

  getFlightBaggage: async (id: number): Promise<Baggage[]> => {
    return request<Baggage[]>(`/flights/${id}/baggage`);
  },

  createFlight: async (flight: Partial<Flight>): Promise<Flight> => {
    return request<Flight>('/flights', {
      method: 'POST',
      body: JSON.stringify(flight),
    });
  },

  updateFlightStatus: async (id: number, status: string): Promise<Flight> => {
    return request<Flight>(`/flights/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Handling Points & Terminals
  getHandlingPoints: async (): Promise<HandlingPoint[]> => {
    return request<HandlingPoint[]>('/handling-points');
  },

  updateHandlingPointStatus: async (id: string, status: string): Promise<HandlingPoint> => {
    return request<HandlingPoint>(`/handling-points/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Exceptions
  getExceptions: async (status?: string, page = 0, size = 20): Promise<{ content: BaggageException[]; totalElements: number }> => {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    params.append('page', page.toString());
    params.append('size', size.toString());
    return request(`/exceptions?${params.toString()}`);
  },

  createException: async (data: { baggageTag: string; exceptionType: string; severity: string; description: string; handlingPointId: string }): Promise<BaggageException> => {
    return request<BaggageException>('/exceptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  resolveException: async (id: number, resolutionNotes: string): Promise<BaggageException> => {
    return request<BaggageException>(`/exceptions/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolutionNotes }),
    });
  },

  // Analytics
  getAnalyticsSummary: async (): Promise<AnalyticsSummary> => {
    return request<AnalyticsSummary>('/analytics/summary');
  },

  exportCsvUrl: (): string => {
    return `${API_BASE}/analytics/export/csv`;
  },

  // Database Center (3 Runtime Databases: PostgreSQL, MongoDB, Neo4j)
  getDatabaseHealth: async (): Promise<DatabaseHealth> => {
    return request<DatabaseHealth>('/database-center/status');
  },

  // Warehouse OLAP
  refreshWarehouse: async (): Promise<WarehouseRefreshResponse> => {
    return request<WarehouseRefreshResponse>('/warehouse/refresh', {
      method: 'POST',
    });
  },

  getWarehouseMetrics: async (): Promise<any> => {
    return request('/warehouse/metrics');
  },

  // System Settings
  getSettings: async (): Promise<SystemSetting[]> => {
    return request<SystemSetting[]>('/settings');
  },

  updateSettings: async (updates: Record<string, string>): Promise<Record<string, string>> => {
    return request<Record<string, string>>('/settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  updateSingleSetting: async (key: string, value: string): Promise<SystemSetting> => {
    return request<SystemSetting>(`/settings/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    });
  },

  // Administration
  getUsers: async (): Promise<User[]> => {
    return request<User[]>('/admin/users');
  },

  createUser: async (user: { username: string; password?: string; fullName: string; role: string; airport?: string }): Promise<User> => {
    return request<User>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  updateUserStatus: async (id: number, active: boolean): Promise<User> => {
    return request<User>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  },

  updateUserRole: async (id: number, role: string): Promise<User> => {
    return request<User>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  getAuditLogs: async (page = 0, size = 25): Promise<{ content: any[]; totalElements: number }> => {
    return request(`/admin/audit-logs?page=${page}&size=${size}`);
  },
};
