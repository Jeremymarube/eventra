import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_BASE
  ? `${process.env.NEXT_PUBLIC_API_BASE.replace(/\/$/, '')}/api`
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
  },
});

const clearAuthStorage = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin-token');
  localStorage.removeItem('token');
  localStorage.removeItem('auth-user');
};

api.interceptors.request.use(
  (config) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return Promise.reject(new Error('Network offline'));
    }

    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    if (typeof window !== 'undefined') {
      const userToken = localStorage.getItem('token');
      const adminToken = localStorage.getItem('admin-token');
      const token = userToken || adminToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response && error.message && typeof window !== 'undefined') {
      alert(
        error.message === 'Network offline'
          ? 'You appear to be offline. Check your internet connection.'
          : 'Network error: unable to reach the server. Please try again.'
      );
    }

    if (error.response?.status === 401) {
      clearAuthStorage();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 403 && typeof console !== 'undefined' && console.warn) {
      console.warn('Access forbidden.', {
        url: error.config?.url,
        method: error.config?.method,
      });
    }

    return Promise.reject(error);
  }
);

export { api };
