// Authentication API Types

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordResetRequest {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export interface PasswordResetResponse {
  message: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}
