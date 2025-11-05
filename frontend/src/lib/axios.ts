// This file handles HTTP requests and token management using Axios
// It includes logic to attach access tokens to requests and refresh them when expired

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { RefreshTokenResponse } from '../types/auth.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable sending cookies with requests
  withCredentials: true,
});

// Token management
let accessToken: string | null = null;

// Export function to set access token
export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const clearTokens = () => {
  accessToken = null;
};

// Getter for current access token (read-only)
export const getAccessToken = (): string | null => accessToken;

// Request interceptor
// Ensure the access token is attached to every request
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) { // Check if exists access token
      config.headers.Authorization = `Bearer ${accessToken}`; // Attach token to header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
// Handle 401 errors and refresh token logic
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const refreshAccessToken = async (): Promise<string> => {
  try {
    // The refresh token will be sent automatically as an HTTP-only cookie
    const response = await axios.post<RefreshTokenResponse>(
      `${BASE_URL}/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const { accessToken: newAccessToken } = response.data;
    accessToken = newAccessToken;
    return newAccessToken;
  } catch (error) {
    clearTokens();
    throw error;
  }
};

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Ngay lập tức reject nếu là lỗi từ endpoints auth
    if (originalRequest.url?.includes('/auth/login') || 
        originalRequest.url?.includes('/auth/register')) {
      console.log('Auth endpoint error, rejecting immediately:', {
        url: originalRequest.url,
        status: error.response?.status,
        data: error.response?.data
      });
      return Promise.reject(error);
    }

    // Xử lý refresh token chỉ cho các endpoint khác khi nhận 401
    if (error.response?.status === 401 && originalRequest.url !== '/auth/refresh') {
      try {
        if (!isRefreshing) {
          console.log('Token expired, attempting refresh...');
          isRefreshing = true;
          const newAccessToken = await refreshAccessToken();
          isRefreshing = false;
          onTokenRefreshed(newAccessToken);
        }

        // Create a new promise that will be resolved when the token is refreshed
        const retryOriginalRequest = new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });

        return retryOriginalRequest;
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearTokens();
        return Promise.reject(refreshError);
      }
    }

    // Reject tất cả các lỗi khác
    return Promise.reject(error);
  }
);
