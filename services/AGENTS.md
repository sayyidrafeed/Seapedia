# Service agent guide

Conventions shared by every service in `services/`. Repository-wide boundary rules are in the root
`AGENTS.md`.

## Core rules

- Prefix every CLI command with `rtk` (e.g. `rtk bun run check`).
- Hono on Bun. No Express.
- Zod validates every HTTP boundary, including responses from other services
  (`createInternalClient(...).get(path, schema)`).
- Build apps with `createServiceApp` (`@seapedia/platform/service`): it adds request ids, error
  mapping, and the internal-token guard. Only `/health` is reachable without the token.
- Identity comes from the gateway as headers. Use `requireSession` and `requireRole` from
  `@seapedia/platform/internal-auth`; never parse the session cookie in a domain service.
- Do not add Redis, a message broker, or Sentry unless explicitly requested.

## Service layout

```
src/
  index.ts        Bun.serve entrypoint (+ outbox consumer loop, if the service consumes events)
  app.ts          route mounting: public /api/*, internal /internal/*, /openapi.json
  env.ts          @t3-oss/env-core validation
  db/             Drizzle client, schema, migrate.ts (services with a database)
  modules/<feature>/
    <feature>.routes.ts            public routes
    <feature>.internal.routes.ts   internal routes (describeRoute({ hide: true }))
    <feature>.service.ts           business logic, never receives a Hono Context
    <feature>.schemas.ts           Zod schemas
    <feature>.index.ts             the module's public exports
drizzle/          this service's migrations
test/setup.ts     test env (bunfig.toml preloads it)
```

## Hono and module rules

- Use `factory.createApp()` for routers and `factory.createMiddleware()` for middleware.
- Handlers are thin and use `c.req.valid()`.
- Middleware order: `requireSession`, `requireRole`, `validator`, handler.
- Cross-module imports go through `<feature>.index.ts`.
- Services throw `DomainError` subclasses; `createServiceApp` maps them to JSON. A failing peer
  (`UpstreamError`) becomes 503.
- Derive types from Drizzle tables or Zod schemas.

## OpenAPI rules

- Every public route has `describeRoute` with a stable `operationId`.
- The gateway merges the services' `/openapi.json`; a path or schema name defined twice with a
  different shape fails the merge. Keep schema ids (`.meta({ id })`) unique across services.
- The web SDK is generated from the gateway: `cd apps/web && rtk bun run openapi:generate`.

## Database rules

- Each service owns one Postgres database; never reference another service's tables.
- Schema files live in `src/db/schema/` and are re-exported from `src/db/schema/index.ts`.
- `rtk bun run db:generate` creates a migration; `bun run start` applies pending migrations.

## Checklist

- [ ] `rtk bun run check`, `rtk bun run fl`, `rtk bun test` pass.
- [ ] New public route added to `services/gateway/src/routes.ts`.
- [ ] Writes that other services depend on enqueue an outbox event in the same transaction.
- [ ] `/openapi.json` still merges at the gateway.
