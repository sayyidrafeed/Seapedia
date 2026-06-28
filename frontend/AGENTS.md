# Frontend Agent Guide

This repository is a React + Vite static SPA hosted via Docker, using Bun, TanStack Router, TanStack Query, Tailwind CSS, shadcn/Radix UI primitives, custom JWT authentication with HTTP-only cookies, and hey-api generated SDKs.

## Core Rules

- Must prefix every CLI command with `rtk` (e.g., `rtk git status`, `rtk bun dev`, `rtk bun check`, `rtk bunx shadcn`).
- Use TanStack Router, not React Router.
- Use TanStack Query for server state.
- Use generated hey-api SDK for backend endpoints.
- Never edit `src/lib/api/generated/` manually.
- Do not expose secrets through `VITE_` variables.
- Quality gates use `bun run check`, not `typecheck`.

## Commands

| Task                 | Command                    |
| -------------------- | -------------------------- |
| Install dependencies | `rtk bun install`              |
| Dev server           | `rtk bun run dev`              |
| Build                | `rtk bun run build`            |
| Preview              | `rtk bun run preview`          |
| Type check           | `rtk bun run check`            |
| Lint                 | `rtk bun run lint`             |
| Format               | `rtk bun run format`           |
| Format + lint        | `rtk bun run fl`               |
| Tests                | `rtk bun run test`             |
| Generate API SDK     | `rtk bun run openapi:generate` |

## Architecture

```
src/
  routes/                  # TanStack Router file routes
  components/ui/           # reusable primitives / shadcn components
  hooks/                   # reusable hooks
  lib/api/generated/       # generated API client, do not edit
  lib/auth/                # custom auth context and session hooks
  lib/query/               # TanStack Query client
  config/                  # env validation (via @t3-oss/env-core)
```

## API SDK

- The backend `/openapi.json` contract is the source of truth.
- Run `bun run openapi:generate` after backend API changes.
- Use generated TanStack Query helpers when possible.
- Fix missing or incorrect generated types in backend OpenAPI, not with frontend DTO duplication.

## Routing

- Route files live under `src/routes/`.
- `routeTree.gen.ts` is generated and must not be edited manually.
- Use route `beforeLoad` for auth guards.
- Use URL search params for shareable filters and pagination.

## Review Checklist

- [ ] No React Router imports.
- [ ] No manual edits to generated API files.
- [ ] `bun run check` passes.
- [ ] `bun run fl` passes.
- [ ] `bun run test` passes.
- [ ] `bun run build` passes.
- [ ] Async views include loading, empty, and error states.
- [ ] No secrets in frontend env variables.
