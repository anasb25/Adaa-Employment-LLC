# State, auth & data fetching

## Auth store (Zustand)

[`store/authStore.ts`](../src/store/authStore.ts) persists:

- **`user`** — hydrated from `/auth/me` shape (see [`types/auth`](../src/types/auth.ts))
- **`accessToken`** / **`refreshToken`**
- **`isAuthenticated`**

Actions:

- **`setAuth`** — mirrors tokens into **localStorage** keys from [`STORAGE_KEYS`](../src/lib/constants.ts) (required by axios interceptor) and updates Zustand.
- **`clearAuth`** — clears tokens + Zustand state.
- **`updateUser`** — shallow merge onto stored user.

Storage key **`STORAGE_KEYS.AUTH_STORAGE`** names the persisted Zustand slice.

### Auth hook behaviour

[`hooks/useAuth.ts`](../src/hooks/useAuth.ts) coordinates login/logout/current user refresh; errors surface via axios + Sonner patterns described below.

---

## TanStack Query

[`providers/AppProviders.tsx`](../src/providers/AppProviders.tsx) wraps the tree in **`QueryClientProvider`**.

Convention:

- **Query keys** centralized in **`QUERY_KEYS`** inside [`lib/constants.ts`](../src/lib/constants.ts) (`auth`, `employees`, `timesheets`, `payroll`, etc.).
- List screens typically use **`useQuery`** + **`useMutation`** with **`queryClient.invalidateQueries`** on success.

---

## Axios client

[`lib/axios.ts`](../src/lib/axios.ts) exports **`axiosInstance`** (`default` export aliases the same).

### Request interceptor

Adds **`Authorization: Bearer <accessToken>`** when `localStorage` contains `STORAGE_KEYS.ACCESS_TOKEN`.

### Response interceptor

- On **401** (non-auth-login paths), attempts **`POST ${API_BASE_URL}/auth/refresh`** with **`refreshToken`**, replaces access token in storage, retries the original request once.
- If refresh fails / missing refresh token → **`localStorage.clear()`** and **`window.location.href = "/signin"`**.
- Non-401 (and auth-route 401) errors → **`sonner`** toasts using `message` or first Nest validation **`errors`** entry.

Avoid duplicating bearer headers on one-off **`axios`** calls unless you deliberately bypass the shared instance (`refresh` path uses bare `axios` by design).

---

## Permissions hook

[`hooks/usePermissions.ts`](../src/hooks/usePermissions.ts) reads **`useAuth().user.role.permissions`** and implements:

- Exact permission match  
- **`{resource}:all`** and **`global:all`** wildcards  

Sidebar and **`PermissionGuard`** rely on this; keep logic aligned with backend RBAC intent when API enforcement is restored.
