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

// Dashboard
export const getDashboardSummary = () => request('/dashboard/summary');
export const getParkingStatus = () => request('/dashboard/parking-status');
export const getRecentViolations = () => request('/dashboard/recent-violations');
export const getParkingLogs = () => request('/dashboard/parking-logs');

// Alerts and violations helpers
export const getUnreadAlerts = (adminId) =>
  request(`/alerts?status=unread&admin_id=${encodeURIComponent(adminId)}`);

export const getViolationsTotal = async () => {
  const resp = await request('/violations?limit=1');
  return resp?.pagination?.totalItems ?? 0;
};

export default {
  login,
  register,
  getDashboardSummary,
  getParkingStatus,
  getRecentViolations,
  getParkingLogs,
  getUnreadAlerts,
  getViolationsTotal,
};
