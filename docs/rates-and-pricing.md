# Rates & pricing

## Intended domain model (backend-aligned)

Production billing/payroll is designed around **rate variants**, **skill-level rates**, and optional **project/employee overrides**:

1. **Rate variants** — time or scenario buckets (regular, overtime, night shift, …). Exactly one variant should carry the **`isBaseRate`** semantics for multiplier math.
2. **Skill rates** — per variant, dual tracking of **employee** vs **client** compensation using **flat** AED/hour figures or **multipliers** anchored to the base variant.
3. **Overrides** — project- or employee-specific adjustments when negotiated deals deviate from defaults.

Cascade priority (conceptual resolver):

```
Employee-specific override → Project override → Canonical skill defaults → Misconfiguration error
```

Multipliers derive from whichever row is flagged as base in variant configuration (`Final = BaseFlat × multiplier`).

This narrative originally lived in **`RATE_SYSTEM_GUIDE.md`** and remains the target architecture documented alongside the Nest service layer.

---

## Frontend & API reality (today)

Operational screens exist:

| UI surface | Implementation notes |
|-----------|-----------------------|
| **Rate variants** | [`RateVariantsManagement`](../src/pages/RateVariantsManagement.tsx) → [`rateVariantsApi`](../src/services/api/rateVariantsApi.ts) |
| **Skill CRUD** | [`skillsApi`](../src/services/api/skillsApi.ts) currently exposes pagination/CRUD/search **only** |
| **Project skills** | [`projectSkillsApi`](../src/services/api/projectSkillsApi.ts) updates a **`sale_price`** style payload via `PUT /projects/:projectId/skills/:skillId` |

There is **no** dedicated Axios module under `services/api` yet for hypothetical paths such as `/skills/:id/rates/bulk`; any advanced configuration modals referenced in superseded Markdown files either live inline in larger components **or** remain to be ported.

---

## Guidance for engineers

When extending pricing UI:

1. Mirror the definitive REST contract enforced by **`adaa-employment-llc-backend`** (see sibling repo `docs/`).  
2. Centralize mutations in **`services/api`** with strongly typed DTOs in **`types/`**.  
3. After writes, invalidate the relevant **`QUERY_KEYS`** subsets (skills, projects, payroll) to refresh dependent dashboards.  
4. Gradually migrate legacy **`sale_price` / `cost_price`** exposures in forms to explicit variant tuples to avoid divergence between SPA display and payroll engines.

[`backlog-suggested-improvements.md`](./backlog-suggested-improvements.md) captures historical UI cleanup proposals (hide redundant columns, add bulk tooling, audit trail, etc.).
