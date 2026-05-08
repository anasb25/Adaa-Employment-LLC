# Routing & navigation

## Route tree

Declared in [`src/App.tsx`](../src/App.tsx) using **`react-router`** (`Routes` / `Route`).

### Protected app shell

Most product routes nest under:

```tsx
<Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
```

[`ProtectedRoute`](../src/components/auth/ProtectedRoute.tsx) redirects to **`/signin`** when **`useAuthStore().isAuthenticated`** is false.

### Public auth routes (`AuthGuard`)

Sign-in flows use **`AuthGuard`** wrapping **`SignIn`**, **`ForgotPassword`**, **`PasswordReset`**: typical pattern is redirect away from these pages when already logged in.

### Invitation acceptance

**`/accept-invitation`** renders **`AcceptInvitation`** with **no** auth guard — token-based signup.

### Fallback

Unknown paths → **`NotFound`** (`*` route).

---

## Canonical paths (functional)

Aligned with imports in [`App.tsx`](../src/App.tsx):

| Path | Screen |
|------|--------|
| `/`, `/expiry-alerts` | Dashboard home (document expiry focus) |
| `/employees` | Employee management |
| `/skills` | Skill management |
| `/clients`, `/projects` | Client & project CRUD |
| `/special-days` | Special days calendar / rates helpers |
| `/rate-variants` | Rate variant definitions |
| `/mobilizations`, `/mobilizations/daily` | Daily mobilization UI |
| `/mobilizations/create` | Create mobilization |
| `/mobilizations/:id/edit` | Edit mobilization |
| `/timesheets`, `/timesheets/monthly` | Monthly project timesheets |
| `/daily-report` | Daily utilization |
| `/payroll` | Payroll |
| `/invoices`, `/invoices/:id` | Invoices list & detail |
| `/settlements` | Settlements |
| `/admin/invitations` | Invitations admin |
| `/admin/roles` | Roles |
| `/admin/users` | Users |
| `/admin/skill-types` | Skill types |
| `/profile` | User profile |

### Template / demo remnants

Still routed but not primary product navigation: **`/calendar`**, **`/blank`**, **`/form-elements`**, **`/basic-tables`**, UI element demos, **`/line-chart`**, **`/bar-chart`** — useful only if you intentionally expose them.

### Public

| Path | Screen |
|------|--------|
| `/signin` | Login |
| `/forgot-password` | Forgot password |
| `/reset-password` | Reset password (token URL) |

---

## Sidebar (`AppSidebar`)

[`layout/AppSidebar.tsx`](../src/layout/AppSidebar.tsx) defines **`navItems`**: Dashboard, Employees (with Skills / Skill Types), Projects (Clients / Projects), Mobilizations, Timesheets, Daily Report, Payroll, Invoices, Settlements, Admin subsection.

Permissions:

- Uses **`usePermissions()`** to hide items when checks fail (`permission`, or object with `permissions` + `operator: "any" | "all"`).
- **Note:** This is client-side filtering only — backend guards must enforce access.
