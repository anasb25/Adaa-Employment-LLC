# API client layer

All modules import the shared Axios instance from [`src/lib/axios.ts`](../src/lib/axios.ts) (named **`axiosInstance`** or default **`api`**). Paths are **relative to** [`API_BASE_URL`](../src/lib/constants.ts) (already includes **`/api`**).

| Module file | Responsibility |
|-------------|----------------|
| [`authApi.ts`](../src/services/api/authApi.ts) | Login, forgot/reset password, refresh, `/auth/me`, change password |
| [`invitationApi.ts`](../src/services/api/invitationApi.ts) | Create/list/cancel/resend invitations; public accept / validate flows |
| [`usersApi.ts`](../src/services/api/usersApi.ts) | User listing, detail, status, role assignment, search |
| [`rolesApi.ts`](../src/services/api/rolesApi.ts) | CRUD roles, assign permissions |
| [`permissionsApi.ts`](../src/services/api/permissionsApi.ts) | CRUD permissions, bulk create |
| [`employeesApi.ts`](../src/services/api/employeesApi.ts) | Employees CRUD, search, export/import endpoints |
| [`employeeSkillsApi.ts`](../src/services/api/employeeSkillsApi.ts) | Nested `employees/:id/skills` |
| [`skillsApi.ts`](../src/services/api/skillsApi.ts) | Skills pagination, CRUD, search |
| [`skillTypesApi.ts`](../src/services/api/skillTypesApi.ts) | Skill types CRUD |
| [`clientsApi.ts`](../src/services/api/clientsApi.ts) | Clients list/search/CRUD, batch delete |
| [`projectsApi.ts`](../src/services/api/projectsApi.ts) | Projects list/search/CRUD, batch delete |
| [`projectSkillsApi.ts`](../src/services/api/projectSkillsApi.ts) | `projects/:projectId/skills` assign/update/remove (**sale price field** today) |
| [`mobilizationsApi.ts`](../src/services/api/mobilizationsApi.ts) | Mobilization CRUD, statistics, imports/exports |
| [`timesheetsApi.ts`](../src/services/api/timesheetsApi.ts) | Monthly grids, daily utilization, submit/approve, entry sync helpers |
| [`specialDaysApi.ts`](../src/services/api/specialDaysApi.ts) | Special-days CRUD, checks, ranges, rate lookups |
| [`rateVariantsApi.ts`](../src/services/api/rateVariantsApi.ts) | Rate-variant CRUD (watch for stray absolute URL usages when editing) |
| [`payrollApi.ts`](../src/services/api/payrollApi.ts) | Payroll CRUD, calculate, imports, PDF download blobs |
| [`invoicesApi.ts`](../src/services/api/invoicesApi.ts) | Invoice lifecycle + PDF blobs |
| [`settlementsApi.ts`](../src/services/api/settlementsApi.ts) | Settlements CRUD, approvals, payouts, Excel |
| [`dashboardApi.ts`](../src/services/api/dashboardApi.ts) | e.g. expiring documents aggregate |

Shared response typing patterns live beside consumers or in [`types/`](../src/types/). When extending the API surface, mirror Nest route segments exactly to avoid duplicated `/api` prefixes.
