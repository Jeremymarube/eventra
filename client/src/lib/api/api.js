import axios from 'axios';

// Always use the full URL to the backend server
const baseURL = 'http://localhost:5000/api';

// Create axios instance with base URL and headers
const api = axios.create({
  baseURL: baseURL,
  withCredentials: false, // This is important for sending cookies with cross-origin requests
  timeout: 10000, // 10 second timeout
  headers: {
    'Accept': 'application/json',
  }
});

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized errors (e.g., redirect to login)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin-token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    // if offline, reject immediately to avoid mysterious network errors
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return Promise.reject(new Error('Network offline'));
    }

    // Don't set Content-Type for FormData, let the browser set it with the correct boundary
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    // Get token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const userToken = localStorage.getItem('token');
      const adminToken = localStorage.getItem('admin-token');
      const token = userToken || adminToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // For debugging
    console.log('Request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
    });

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    try {
      // Safely log error details.  Avoid printing an empty object which
      // is confusing; only log when we have meaningful information.
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data,
        message: error.message
      };

      const hasInfo = Object.values(errorDetails).some((v) => v !== undefined && v !== null && v !== '');

      if (hasInfo) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('API Response Error:', errorDetails);
        } else if (process.env.NODE_ENV === 'development') {
          console.log('API Response Error:', errorDetails);
        }
      }
    } catch (logError) {
      console.log('Error in error handler:', logError);
    }

    // Specific network offline or generic network errors
    if (!error.response && error.message) {
      // show friendly message to user
      if (typeof window !== 'undefined') {
        alert(
          error.message === 'Network offline'
            ? 'You appear to be offline. Check your internet connection.'
            : 'Network error: unable to reach the server. Please try again.'
        );
      }
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      console.log('Authentication failed, redirecting to login...');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    // For 403 errors, show more details
    if (error.response?.status === 403) {
      console.error('Access forbidden. Possible issues:', {
        token: typeof window !== 'undefined' ? localStorage.getItem('token') : 'No token (server-side)',
        url: error.config?.url,
        method: error.config?.method,
      });
    }

    return Promise.reject(error);
  }
);

export { api };
