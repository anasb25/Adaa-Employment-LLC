// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const API_TIMEOUT = 30000;

// Query Keys
export const QUERY_KEYS = {
  auth: {
    currentUser: ["currentUser"] as const,
  },
  roles: {
    all: ["roles"] as const,
    detail: (id: number) => ["roles", id] as const,
  },
  invitations: {
    all: ["invitations"] as const,
    my: ["invitations", "my"] as const,
    detail: (id: number) => ["invitations", id] as const,
  },
  permissions: {
    all: ["permissions"] as const,
    detail: (id: number) => ["permissions", id] as const,
  },
  users: {
    all: ["users"] as const,
    detail: (id: number) => ["users", id] as const,
    search: ["users", "search"] as const,
  },
  employees: {
    all: ["employees"] as const,
    detail: (id: number) => ["employees", id] as const,
    search: ["employees", "search"] as const,
    skills: (id: number) => ["employees", id, "skills"] as const,
  },
  skills: {
    all: ["skills"] as const,
    detail: (id: number) => ["skills", id] as const,
    search: ["skills", "search"] as const,
  },
  clients: {
    all: ["clients"] as const,
    detail: (id: number) => ["clients", id] as const,
    search: ["clients", "search"] as const,
  },
  projects: {
    all: ["projects"] as const,
    detail: (id: number) => ["projects", id] as const,
    search: ["projects", "search"] as const,
  },
  skillTypes: {
    all: ["skillTypes"] as const,
  },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
  AUTH_STORAGE: "auth-storage",
} as const;
