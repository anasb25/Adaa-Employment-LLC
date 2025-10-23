import axiosInstance from "../../lib/axios";
import {
  LoginRequest,
  LoginResponse,
  PasswordResetRequest,
  PasswordResetResponse,
} from "../../types/auth";

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosInstance.post<LoginResponse>(
      "/auth/login",
      credentials
    );
    return response.data;
  },

  resetPassword: async (
    data: PasswordResetRequest
  ): Promise<PasswordResetResponse> => {
    const response = await axiosInstance.post<PasswordResetResponse>(
      "/auth/forgot-password",
      data
    );
    return response.data;
  },

  refreshToken: async (
    refreshToken: string
  ): Promise<{ accessToken: string }> => {
    const response = await axiosInstance.post<{ accessToken: string }>(
      "/auth/refresh",
      { refreshToken }
    );
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post("/auth/logout");
  },

  getCurrentUser: async () => {
    const response = await axiosInstance.get("/auth/me");
    return response.data;
  },
};
