# ADAA Employment LLC — Frontend documentation

This folder is the **single** place for Markdown documentation for the React SPA (`adaa-employment-llc`). There is **no** `README.md` at the repository root.

## Contents

| Document | Description |
|----------|-------------|
| [Getting started](./getting-started.md) | Install, dev server, build, tooling |
| [Architecture](./architecture.md) | Stack, entry points, layout, providers |
| [Configuration](./configuration.md) | Environment variables and API base URL |
| [Routing & navigation](./routing-and-navigation.md) | `App.tsx` routes and sidebar map |
| [State, auth & data fetching](./state-auth-and-data.md) | Zustand, React Query, axios |
| [API client layer](./api-client-layer.md) | `src/services/api/*` modules |
| [Auth, invitations & permissions](./auth-invitations-permissions.md) | Login flow, invites, `PermissionGuard`, wildcards |
| [Feature areas](./feature-areas.md) | Screens grouped by business domain |
| [Rates & pricing](./rates-and-pricing.md) | Intended rate-variant model vs current UI/API wiring |
| [Backlog & suggested improvements](./backlog-suggested-improvements.md) | Condensed backlog from legacy notes |

## Companion backend docs

REST contracts and security behaviour are documented separately in **`adaa-employment-llc-backend/docs/`** (sibling repository in the same workspace root).

## License

Legal text remains in **`LICENSE.md`** at the project root.
