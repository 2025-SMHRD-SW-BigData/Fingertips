// Centralized API service for frontend
// Uses Vite env when available, falls back to proxy path '/api'

const API_ORIGIN = (import.meta && import.meta.env && import.meta.env.VITE_API_TARGET) || '';
const API_BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) || '/api';
const BASE_URL = `${API_ORIGIN}${API_BASE}`.replace(/\/$/, '');

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Optional auth header if token exists
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const useCredentials = (import.meta && import.meta.env && import.meta.env.VITE_USE_CREDENTIALS) === '1';

  const res = await fetch(url, {
    credentials: useCredentials ? 'include' : 'same-origin',
    ...options,
    headers,
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }
  } else {
    data = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Selected parking index (persisted)
function getSelectedParkingIdx() {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem('parking_idx') : null;
    if (!v) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  } catch (_) {
    return null;
  }
}

// Auth
export const login = (credentials) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const register = (userData) =>
  request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

// Change password
export const changePassword = (payload = {}) =>
  request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// Parking list
export const getParkings = () => request('/parking');

// Parkings filtered by administrative district code
export const getParkingsByDistrict = (code) => {
  const c = (code ?? '').toString().trim();
  if (!c) return getParkings();
  return request(`/parking?district=${encodeURIComponent(c)}`);
};

// Dashboard
export const getDashboardSummary = ({ parkingIdx } = {}) => {
  const idx = parkingIdx ?? getSelectedParkingIdx();
  const q = idx ? `?parking_idx=${encodeURIComponent(idx)}` : '';
  return request(`/dashboard/summary${q}`);
};

export const getParkingStatus = ({ parkingIdx } = {}) => {
  const idx = parkingIdx ?? getSelectedParkingIdx();
  const q = idx ? `?parking_idx=${encodeURIComponent(idx)}` : '';
  return request(`/dashboard/parking-status${q}`);
};

export const getRecentViolations = ({ parkingIdx } = {}) => {
  const idx = parkingIdx ?? getSelectedParkingIdx();
  const q = idx ? `?parking_idx=${encodeURIComponent(idx)}` : '';
  return request(`/dashboard/recent-violations${q}`);
};

export const getParkingLogs = ({ parkingIdx } = {}) => {
  const idx = parkingIdx ?? getSelectedParkingIdx();
  const q = idx ? `?parking_idx=${encodeURIComponent(idx)}` : '';
  return request(`/dashboard/parking-logs${q}`);
};

// Alerts and violations helpers
export const getUnreadAlerts = (adminId) =>
  request(`/alerts?status=unread&admin_id=${encodeURIComponent(adminId)}`);

// Alerts list by status (all|unread)
export const getAlerts = (adminId, { status = 'all' } = {}) =>
  request(`/alerts?admin_id=${encodeURIComponent(adminId)}&status=${encodeURIComponent(status)}`);

// Update single alert (e.g., { read: true })
export const updateAlert = (id, body = {}) =>
  request(`/alerts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export const getViolationsTotal = async () => {
  const resp = await request('/violations?limit=1');
  return resp?.pagination?.totalItems ?? 0;
};

// Helpers for violations list/detail
const buildQuery = (params = {}) => {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val === undefined || val === null || val === '') return;
    qp.set(key, String(val));
  });
  const s = qp.toString();
  return s ? `?${s}` : '';
};

const normalizeViolationsListResponse = (data, { page = 1, limit = 10 } = {}) => {
  // Accept various backend shapes and normalize
  let items = [];
  let totalItems = undefined;
  let pageSize = limit;
  let currentPage = page;
  let totalPages = undefined;

  if (Array.isArray(data)) {
    items = data;
    totalItems = data.length;
    totalPages = 1;
  } else if (data && typeof data === 'object') {
    if (Array.isArray(data.items)) items = data.items;
    else if (Array.isArray(data.data)) items = data.data;
    else if (Array.isArray(data.results)) items = data.results;

    const pg = data.pagination || data.meta || data.pageInfo || {};
    totalItems = pg.totalItems ?? pg.total ?? data.total ?? items.length;
    pageSize = pg.pageSize ?? pg.limit ?? limit;
    currentPage = pg.page ?? pg.currentPage ?? page;
    totalPages = pg.totalPages ?? (totalItems && pageSize ? Math.ceil(totalItems / pageSize) : undefined);
  }

  return {
    items,
    pagination: {
      totalItems: totalItems ?? items.length,
      pageSize,
      currentPage,
      totalPages: totalPages ?? (pageSize ? Math.ceil((totalItems ?? items.length) / pageSize) : 1),
    },
  };
};

// Violations list with optional filters/pagination
export const getViolations = async ({
  page = 1,
  limit = 10,
  sort,
  from,
  to,
  keyword,
  type,
  status,
  parkingIdx,
} = {}) => {
  const idx = parkingIdx ?? getSelectedParkingIdx();
  const query = buildQuery({ page, limit, sort, from, to, keyword, type, status, parking_idx: idx });
  const raw = await request(`/violations${query}`);
  return normalizeViolationsListResponse(raw, { page, limit });
};

// Single violation detail
export const getViolationById = (id) => request(`/violations/${encodeURIComponent(id)}`);

// Stats (StatisticsPage)
const qp = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const getStatsByType = (params = {}) => {
  const idx = params.parking_idx ?? params.parkingIdx ?? getSelectedParkingIdx();
  return request(`/stats/by-type${qp({ ...params, parking_idx: idx })}`);
};
export const getStatsByDate = (params = {}) => {
  const idx = params.parking_idx ?? params.parkingIdx ?? getSelectedParkingIdx();
  return request(`/stats/by-date${qp({ ...params, parking_idx: idx })}`);
};
export const getStatsByLocation = (params = {}) => {
  const idx = params.parking_idx ?? params.parkingIdx ?? getSelectedParkingIdx();
  return request(`/stats/by-location${qp({ ...params, parking_idx: idx })}`);
};
export const getStatsByHour = (params = {}) => {
  const idx = params.parking_idx ?? params.parkingIdx ?? getSelectedParkingIdx();
  return request(`/stats/by-hour${qp({ ...params, parking_idx: idx })}`);
};

// Parking summary per lot (ALL or by parking_idx)
export const getParkingSummaryByLot = (params = {}) => {
  const idx = params.parking_idx ?? params.parkingIdx ?? getSelectedParkingIdx();
  const q = idx ? `?parking_idx=${encodeURIComponent(idx)}` : '';
  return request(`/dashboard/summary-by-parking${q}`);
};

export default {
  login,
  register,
  getDashboardSummary,
  getParkingStatus,
  getRecentViolations,
  getParkingLogs,
  getParkings,
  getParkingsByDistrict,
  getUnreadAlerts,
  getAlerts,
  updateAlert,
  getViolationsTotal,
  getViolations,
  getViolationById,
  getStatsByType,
  getStatsByDate,
  getStatsByLocation,
  getStatsByHour,
  getParkingSummaryByLot,
  changePassword,
};
