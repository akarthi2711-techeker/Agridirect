import axios from 'axios';

// Uses REACT_APP_API_URL from .env.production at build time
// Fallback to localhost for local development
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — clear session and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── AI Market Advisor API helpers ───────────────────────────────────────────

export const aiAPI = {
  chat: (message, intent = null) =>
    api.post('/ai/chat', { message, intent }, { timeout: 35000 }),

  marketPrices: (crop) =>
    api.get('/market/prices', { params: { crop } }),

  marketTrends: (crop, days = 30) =>
    api.get('/market/trends', { params: { crop, days } }),

  nearbyMarkets: (crop) =>
    api.get('/market/nearby', { params: { crop } }),

  cropRecommend: (soilType, season, location) =>
    api.post('/crop/recommend', { soilType, season, location }, { timeout: 35000 }),

  chatHistory: (limit = 50) =>
    api.get('/chat/history', { params: { limit } }),
};
