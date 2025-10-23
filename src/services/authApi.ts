import {
  LoginRequest,
  LoginResponse,
  PasswordResetRequest,
  PasswordResetResponse,
} from "../types/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class AuthApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new AuthApiError(
      errorData.message || "An error occurred",
      response.status,
      errorData.errors
    );
  }
  return response.json();
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    return handleResponse<LoginResponse>(response);
  },

  async resetPassword(
    data: PasswordResetRequest
  ): Promise<PasswordResetResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return handleResponse<PasswordResetResponse>(response);
  },
};

export { AuthApiError };
