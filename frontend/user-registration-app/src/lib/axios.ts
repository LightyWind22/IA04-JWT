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
    console.log('Refreshed Access Token:', newAccessToken);
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

    // If the error is not 401 or the request was for refreshing token, reject
    if (
      error.response?.status !== 401 ||
      originalRequest.url === '/auth/refresh'
    ) {
      return Promise.reject(error);
    }

    try {
      if (!isRefreshing) {
        isRefreshing = true; // Set refreshing flag
        const newAccessToken = await refreshAccessToken(); // Refresh the access token
        isRefreshing = false; // Reset refreshing flag
        onTokenRefreshed(newAccessToken); // Notify all subscribers with new token
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
      clearTokens();
      return Promise.reject(refreshError);
    }
  }
);
