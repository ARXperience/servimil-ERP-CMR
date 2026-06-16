import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Do not intercept 401s for login or refresh endpoints
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      
      try {
        // Assume there is a refresh endpoint
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        if (refreshToken) {
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken: refreshToken
          });
          
          if (res.data.accessToken) {
            useAuthStore.getState().setAccessToken(res.data.accessToken);
            if (res.data.refreshToken) {
              localStorage.setItem('refreshToken', res.data.refreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return new Promise(() => {}); // Prevent unhandled rejection while redirecting
      }
      
      useAuthStore.getState().logout();
      return new Promise(() => {}); // Prevent unhandled rejection while redirecting
    }
    
    return Promise.reject(error);
  }
);

export default api;
