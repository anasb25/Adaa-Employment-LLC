# Architecture

## Shape of the codebase

Single-page application built with **Vite + React + TypeScript**. Application code lives under **`src/`**:

| Area | Role |
|------|------|
| [`pages/`](../src/pages/) | Route-level screens (dashboard, CRUD hubs, auth) |
| [`components/`](../src/components/) | Reusable UI, feature widgets, forms, modals |
| [`layout/`](../src/layout/) | `AppLayout`, sidebar, chrome |
| [`services/api/`](../src/services/api/) | Thin HTTP wrappers (axios) grouped by backend resource |
| [`store/`](../src/store/) | Global client state (e.g. `authStore`) |
| [`hooks/`](../src/hooks/) | Composition hooks (`useAuth`, `usePermissions`, debounced search, etc.) |
| [`types/`](../src/types/) | TypeScript models aligned with API payloads |
| [`lib/`](../src/lib/) | Shared utilities (`axios` instance, `constants`, helpers) |
| [`context/`](../src/context/) | Theme and sidebar UI state |

## Bootstrap

[`main.tsx`](../src/main.tsx) mounts `<App />` inside:

- **`StrictMode`**
- **`ThemeProvider`** — light/dark and related UI context ([`context/ThemeContext.tsx`](../src/context/ThemeContext.tsx))
- **`AppWrapper`** — document metadata shell ([`components/common/PageMeta.tsx`](../src/components/common/PageMeta.tsx))

[`App.tsx`](../src/App.tsx) nests:

1. **`AppProviders`** — React Query client + Sonner toaster ([`providers/AppProviders.tsx`](../src/providers/AppProviders.tsx))
2. **`BrowserRouter`** + route tree (see [Routing](./routing-and-navigation.md))

## Layout shell

Authenticated routes wrap content in **`ProtectedRoute`** → **`AppLayout`** ([`App.tsx`](../src/App.tsx)).

- Sidebar navigation and visibility rules live in [`layout/AppSidebar.tsx`](../src/layout/AppSidebar.tsx) (permissions-aware).
- Header / user dropdown and theme toggle integrate with sidebar context where applicable.

## Styling & assets

- Global styles: [`index.css`](../src/index.css) with Tailwind 4 toolchain ([`tailwind` / `postcss` in package.json](../package.json)).
- Third-party CSS: Swiper bundle, Flatpickr (also imported from `main.tsx`).

## Backend boundary

All runtime data assumes a **NestJS REST API** with prefix `/api`. The SPA never embeds business rules that should be authoritative server-side (validation, payroll math, RBAC enforcement); frontend checks are UX-only.
