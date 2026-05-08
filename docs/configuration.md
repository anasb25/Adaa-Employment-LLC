# Configuration

## API base URL

Defined in [`src/lib/constants.ts`](../src/lib/constants.ts):

```ts
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";
```

### Environment variable

| Name | Purpose |
|------|---------|
| **`VITE_API_URL`** | Full base URL for the Nest API **including `/api`** (e.g. `http://localhost:3000/api` or `https://api.example.com/api`) |

Create a **`.env`** or **`.env.local`** at the project root (Vite convention). Prefix **`VITE_`** is required for exposure to client-side code.

## Request timeout

`API_TIMEOUT` in [`constants.ts`](../src/lib/constants.ts) is **30000** ms unless changed.

## Local storage keys

Auth-related keys are centralized in **`STORAGE_KEYS`** in [`constants.ts`](../src/lib/constants.ts) (`accessToken`, `refreshToken`, persisted Zustand `auth-storage`, etc.). Keep these stable to avoid orphaned sessions after deploy.

## React Query defaults

Configured in [`AppProviders.tsx`](../src/providers/AppProviders.tsx):

- Queries: `refetchOnWindowFocus: false`, `retry: 1`, default `staleTime` 30s  
- Mutations: `retry: 0`

Individual hooks may override (e.g. search-heavy lists).
