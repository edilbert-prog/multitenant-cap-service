import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000,
});

// Request interceptor for adding auth tokens if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }

    // Extract error message from backend response
    if (error.response?.data?.message) {
      // Create a new error with the backend message
      const backendError = new Error(error.response.data.message);
      // Preserve original error properties
      (backendError as any).response = error.response;
      (backendError as any).code = error.code;
      return Promise.reject(backendError);
    }

    return Promise.reject(error);
  }
);
