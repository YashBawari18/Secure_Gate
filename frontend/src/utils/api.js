import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('sg_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sg_token');
      localStorage.removeItem('sg_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  me: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
};

export const visitorsAPI = {
  getAll: (params) => API.get('/visitors', { params }),
  create: (data) => API.post('/visitors', data),
  approve: (id) => API.patch(`/visitors/${id}/approve`),
  deny: (id) => API.patch(`/visitors/${id}/deny`),
  exit: (id) => API.patch(`/visitors/${id}/exit`),
  watchlist: (id) => API.patch(`/visitors/${id}/watchlist`),
  verifyOTP: (data) => API.post('/visitors/verify-otp', data),
  verifyQR: (data) => API.post('/visitors/verify-qr', data),
  getQR: (id) => API.get(`/visitors/${id}/qr`),
  getStats: () => API.get('/visitors/stats/today'),
};

export const alertsAPI = {
  getAll: (params) => API.get('/alerts', { params }),
  dismiss: (id) => API.patch(`/alerts/${id}/dismiss`),
  escalate: (id) => API.patch(`/alerts/${id}/escalate`),
  create: (data) => API.post('/alerts', data),
};

export const analyticsAPI = {
  getOverview: () => API.get('/analytics/overview'),
};

export const usersAPI = {
  getAll: (params) => API.get('/users', { params }),
  create: (data) => API.post('/users', data),
  update: (id, data) => API.patch(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
};

export default API;
