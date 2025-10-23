import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from "./constants";

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (
    error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>
  ) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.clear();
          window.location.href = "/signin";
          return Promise.reject(error);
        }

        // Try to refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.clear();
        window.location.href = "/signin";
        toast.error("Session expired. Please login again.");
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorMessage = error.response?.data?.message || "An error occurred";

    // Show toast for errors (except 401 which we handle above)
    if (error.response?.status !== 401) {
      // Check for validation errors
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const firstError = Object.values(validationErrors)[0]?.[0];
        toast.error(firstError || errorMessage);
      } else {
        toast.error(errorMessage);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
