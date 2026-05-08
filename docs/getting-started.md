# Getting started

## Prerequisites

- **Node.js** 18+ (README previously recommended 20+)
- npm, yarn, or pnpm

## Install

```bash
npm install
```

If peer dependency conflicts appear, npm’s `--legacy-peer-deps` flag may be required ([`package.json`](../package.json)).

## Development server

```bash
npm run dev
```

Vite prints a local URL (default port **5173** unless configured).

Ensure the Nest API is running and reachable; set [`VITE_API_URL`](./configuration.md) when not using `http://localhost:3000/api`.

## Production build

```bash
npm run build
# or
npm run build:prod
```

Output is emitted to **`dist/`** (Vite default).

## Preview production build locally

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Tech stack snapshot

Defined in [`package.json`](../package.json):

- React 19, TypeScript, Vite 6  
- Tailwind CSS 4  
- React Router 7  
- TanStack React Query 5  
- Zustand 5  
- Axios, Sonner (toasts), plus chart/calendar/excel helpers as needed per feature  
