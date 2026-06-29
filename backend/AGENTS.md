# Backend Agent Guide

This repository is a Hono REST API deployed on a Bun HTTP server, using TypeScript, Zod runtime validation, Drizzle ORM with PostgreSQL (`postgres`), custom JWT authentication, Scalar API Reference, and OpenAPI output for hey-api SDK generation.

## Core Rules

- Must prefix every CLI command with `rtk` (e.g., `rtk git status`, `rtk bun dev`, `rtk bun check`, `rtk bunx shadcn`).
- Use Hono, not Express.
- Use Zod runtime validation for every HTTP boundary.
- Serve Scalar docs at `/docs`.
- Serve OpenAPI JSON at `/openapi.json`.
- Keep `/openapi.json` compatible with `@hey-api/openapi-ts`.
- Use Drizzle with PostgreSQL (via `postgres` driver).
- Do not add Redis, BullMQ, workers, or Sentry unless explicitly requested.
- Quality gates use `bun run check`, not `typecheck`.

## Commands

| Task                  | Command                   |
| --------------------- | ------------------------- |
| Install dependencies  | `rtk bun install`         |
| Dev server            | `rtk bun run dev`         |
| Type check            | `rtk bun run check`       |
| Lint                  | `rtk bun run lint`        |
| Format                | `rtk bun run format`      |
| Format + lint         | `rtk bun run fl`          |
| Tests                 | `rtk bun test`            |
| Generate DB migration | `rtk bun run db:generate` |
| Apply DB migration    | `rtk bun run db:migrate`  |
| Drizzle Studio        | `rtk bun run db:studio`   |

## Architecture

```
src/
  index.ts           # Bun.serve server entrypoint
  app.ts             # Hono app composition, middleware, docs, routes
  env.ts             # env validation (via @t3-oss/env-core)
  db/
    index.ts         # PostgreSQL + Drizzle client
    schema/          # Drizzle table definitions
  lib/
    errors.ts        # DomainError base classes
    factory.ts       # typed Hono factory
    openapi.ts       # OpenAPI helpers (upgraded with resolver)
    schemas.ts       # shared Zod/OpenAPI schemas
  middleware/
    auth.ts          # requireSession (custom JWT validation), requireRole
  modules/
    [feature]/       # vertical feature slices
```

The backend is a modular monolith. Feature code lives in `src/modules/[feature]/`.

## Hono Rules

- Use `factory.createApp()` for apps and routers.
- Use `factory.createMiddleware()` for middleware.
- Services never receive Hono `Context`.
- Handlers are thin and use `c.req.valid()` for validated inputs.
- Middleware order is `requireSession -> requireRole -> validator -> handler`.

## Module Rules

- Keep each feature as a vertical slice.
- Cross-module imports must go through `[feature].index.ts`.
- Services throw domain errors.
- `app.onError` maps domain errors to HTTP JSON.
- Types derive from Drizzle tables or Zod schemas. Do not duplicate DTOs manually.

## OpenAPI Rules

- Every route must define OpenAPI metadata using `describeRoute`.
- Every request body, query, and param must use Zod validation via `validator`.
- Every frontend-consumed response must have a schema reflected in OpenAPI.
- Operation IDs must be stable.
- If generated frontend SDK types are wrong, fix backend OpenAPI.

## Database Rules

- Schema files live in `src/db/schema/`.
- Re-export tables from `src/db/schema/index.ts`.
- Use `bun run db:generate` to create migrations, `bun run db:migrate` to apply.
- Drizzle uses `drizzle-orm/postgres-js` adapter for runtime, `dialect: postgresql`.
- Migrations managed via drizzle-kit.

## Review Checklist

- [ ] No Express code.
- [ ] No raw request parsing where validator exists.
- [ ] No Hono `Context` in services.
- [ ] No manual DTO duplication when types can be inferred.
- [ ] `/docs` works.
- [ ] `/openapi.json` works.
- [ ] Frontend can generate SDK from `/openapi.json`.
- [ ] `bun run check` passes.
- [ ] `bun run fl` passes.
- [ ] `bun test` passes.
