# Auth, invitations & permissions

## End-user authentication

- **Pages:** [`SignIn`](../src/pages/AuthPages/SignIn.tsx), [`ForgotPassword`](../src/pages/AuthPages/ForgotPassword.tsx), [`PasswordReset`](../src/pages/AuthPages/PasswordReset.tsx) under **`/signin`**, **`/forgot-password`**, **`/reset-password`** ([`App.tsx`](../src/App.tsx)).
- **HTTP:** [`authApi.ts`](../src/services/api/authApi.ts) wraps `/auth/*` endpoints.
- **Persistence:** Tokens + hydrated user captured in [**`authStore`**](./state-auth-and-data.md).

After login, dashboards load with **`ProtectedRoute`** gating **`AppLayout`**.

---

## Invitations (mirror of backend `/api/invitations`)

Frontend pieces:

| Piece | Role |
|-------|------|
| [`AdminInvitationsDemo`](../src/pages/AdminInvitationsDemo.tsx) (routed **`/admin/invitations`**) | Admin UI shell for invite workflow |
| [`components/invitations/`](../src/components/invitations/) | `InvitationForm`, `InvitationList`, related UI |
| [`invitationApi.ts`](../src/services/api/invitationApi.ts) | REST calls |

**Public** acceptance path **`/accept-invitation`** renders [`AcceptInvitation`](../src/pages/AuthPages/AcceptInvitation.tsx) and uses token validation helpers from `invitationApi` without JWT.

Operational notes:

- Emails originate from the Nest mail configuration; failures appear as API/toast errors in the SPA.
- Resend/cancel operations require JWT + backend permission expectations.

---

## `PermissionGuard` component

[`components/auth/PermissionGuard.tsx`](../src/components/auth/PermissionGuard.tsx) conditionally renders children using **`usePermissions()`**.

Typical props (see usages across admin and skills UI):

| Prop | Behaviour |
|------|-----------|
| **`permission`** | Single string |
| **`permissions`** | Array — default **ANY** (`requireAll` false) or **ALL** when `requireAll` |
| **`roles`** | Allowed role names |

**Wildcard parity** mirrors [`hooks/usePermissions`](../src/hooks/usePermissions.ts): **`resource:all`**, **`global:all`**.

### Limitations / backend alignment

Nest **RolesGuard**/**PermissionsGuard** may be permissive depending on backend configuration; **`PermissionGuard` should not be treated as a security barrier** — it only informs UX visibility.

---

## Inviting users: checklist

1. Caller must authenticate and hold sufficient permissions (`user:create` on backend when guards enabled).
2. Choose target role IDs from Roles API/UI.
3. Handle duplicate-email or expired-token errors surfaced by axios toasts.

For deeper REST documentation, consume the sibling backend docs at `adaa-employment-llc-backend/docs/security-auth-rbac.md` when both repos live side by side.
