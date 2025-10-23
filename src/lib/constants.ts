// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const API_TIMEOUT = 10000;

// Query Keys
export const QUERY_KEYS = {
  auth: {
    currentUser: ["currentUser"] as const,
  },
  // Add more query keys as needed
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
  AUTH_STORAGE: "auth-storage",
} as const;
