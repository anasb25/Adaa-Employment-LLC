# Backlog & suggested improvements

Historical notes lived in **`SUGGESTED_IMPROVEMENTS.md`** and sibling rate documents. Items below stay **non-binding**; prioritize with product/engineering independently.

## UI / UX

- Reduce legacy **`cost_price` / `sale_price`** columns once variant-based tooling ships for every persona (skills list, imports, spreadsheets).
- Add **bulk rate assignment** workflows (templates, copy-from-skill) to administrative screens.
- Surface **configuration completeness** (e.g., `configured variants / active variants`).
- Tooltip or drawer **rate previews** straight from listing tables without modal friction.

## Data integrity

- Enforce—or loudly warn—when publishing skills lacking a **base variant** hourly configuration.
- Add client-side validations before save (example: employee rate should remain below client-facing charge unless intentionally subsidized).

## Engineering quality

- Ensure every finance-critical mutation path uses **TanStack Query** invalidation intentionally (skills ↔ payroll dashboards).
- Add integration/E2E coverage for spreadsheet imports (mobilizations, payroll allowances).

## Visualization & analytics dashboards

Story-only ideas from original doc: managerial dashboards summarizing variant coverage across the skill catalogue, profit margin outliers, stale negotiations.

---

When closing an item from this backlog, trim or annotate this file so the documentation continues to mirror reality rather than aspiration.
