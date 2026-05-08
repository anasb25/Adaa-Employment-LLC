# Feature areas

This maps **major SPA screens** to their primary collaborators (pages/components/services). It is descriptive, not exhaustive.

## Dashboard & compliance

| Route | Highlights |
|-------|-------------|
| `/`, `/expiry-alerts` | [`Dashboard/Home`](../src/pages/Dashboard/Home.tsx), widgets such as [`ExpiringDocumentsCard`](../src/components/dashboard/ExpiringDocumentsCard.tsx); [`dashboardApi`](../src/services/api/dashboardApi.ts) |

## HR core

| Concern | Entry | Clients |
|---------|-------|---------|
| Employees | `/employees` | [`EmployeeManagement`](../src/pages/EmployeeManagement.tsx), [`employeesApi`](../src/services/api/employeesApi.ts), import/export helpers, modals (`AirTicketHistoryModal`, annual leave tooling) |
| Skills & types | `/skills`, `/admin/skill-types` | [`SkillManagement`](../src/pages/SkillManagement.tsx), [`skillsApi`](../src/services/api/skillsApi.ts), [`skillTypesApi`](../src/services/api/skillTypesApi.ts) |
| Employee skills | Embedded in employee forms | [`EmployeeSkillManager`](../src/components/employees/EmployeeSkillManager.tsx), [`employeeSkillsApi`](../src/services/api/employeeSkillsApi.ts) |

## Commercial structure

| Concern | Entry | Clients |
|---------|-------|---------|
| Clients | `/clients` | [`ClientManagement`](../src/pages/ClientManagement.tsx), [`clientsApi`](../src/services/api/clientsApi.ts) |
| Projects | `/projects` | [`ProjectManagement`](../src/pages/ProjectManagement.tsx), [`projectsApi`](../src/services/api/projectsApi.ts), [`ProjectSkillsModal`](../src/components/projects/ProjectSkillsModal.tsx) |

## Scheduling & staffing

| Concern | Entry | Clients |
|---------|-------|---------|
| Mobilizations | `/mobilizations/*` | [`DailyMobilizationManagement`](../src/pages/DailyMobilizationManagement.tsx), [`CreateMobilization`](../src/pages/CreateMobilization.tsx), [`EditMobilization`](../src/pages/EditMobilization.tsx), [`mobilizationsApi`](../src/services/api/mobilizationsApi.ts), import/export modals |
| Timesheets | `/timesheets*` | [`MonthlyProjectTimesheets`](../src/pages/MonthlyProjectTimesheets.tsx), [`timesheetsApi`](../src/services/api/timesheetsApi.ts), export modal components |
| Utilization reporting | `/daily-report` | [`DailyUtilizationReport`](../src/pages/DailyUtilizationReport.tsx) |

## Calendar & billing rates configuration

| Concern | Entry | Clients |
|---------|-------|---------|
| Special days | `/special-days` | [`SpecialDaysManagement`](../src/pages/SpecialDaysManagement.tsx), [`specialDaysApi`](../src/services/api/specialDaysApi.ts) |
| Rate variants | `/rate-variants` | [`RateVariantsManagement`](../src/pages/RateVariantsManagement.tsx), [`rateVariantsApi`](../src/services/api/rateVariantsApi.ts) |

See [Rates & pricing](./rates-and-pricing.md) for how pricing concepts relate to backend models.

## Finance

| Concern | Entry | Clients |
|---------|-------|---------|
| Payroll | `/payroll` | [`PayrollManagement`](../src/pages/PayrollManagement.tsx), [`payrollApi`](../src/services/api/payrollApi.ts), utilities like [`payrollAirTickets`](../src/utils/payrollAirTickets.ts) |
| Invoices | `/invoices*` | [`InvoiceManagement`](../src/pages/InvoiceManagement.tsx), [`InvoiceDetail`](../src/pages/InvoiceDetail.tsx), [`invoicesApi`](../src/services/api/invoicesApi.ts) |
| Settlements | `/settlements` | [`SettlementManagement`](../src/pages/SettlementManagement.tsx), [`settlementsApi`](../src/services/api/settlementsApi.ts), reusable settlement widgets |

## Administration & RBAC UI

| Route | Highlights |
|-------|-------------|
| `/admin/invitations` | Invite flows |
| `/admin/roles` | [`RoleManagement`](../src/pages/RoleManagement.tsx) |
| `/admin/users` | [`UserManagement`](../src/pages/UserManagement.tsx) |

## Profile & miscellaneous

`/profile` houses user-facing profile composition components.

Template routes under **`/form-elements`**, **`/videos`**, etc., remain wired for prototyping.
