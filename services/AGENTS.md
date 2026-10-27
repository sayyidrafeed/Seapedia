# Service agent guide

Conventions shared by every service in `services/`. Repository-wide boundary rules are in the root
`AGENTS.md`.

## Core rules

- Prefix every CLI command with `rtk` (e.g. `rtk bun run check`).
- Hono on Bun. No Express.
- Zod validates every HTTP boundary, including responses from other services
  (`createInternalClient(...).get(path, schema)`).
- Build apps with `createServiceApp` (`@seapedia/platform/service`): request ids, error mapping,
  and access-token verification (`authenticate`). Shared infrastructure (verifier, denylist,
  RabbitMQ, Consul resolver, service tokens) comes from `createRuntime` in `src/runtime.ts`.
- Authorize with `requireSession` / `requireRole` (users) and `requireServiceScope` (services)
  from `@seapedia/platform/auth`.
- Configuration: secrets and addresses in `src/env.ts`; tunables in `src/config.ts` (Consul KV,
  `sharedConfigSchema.extend(...)`, read through `config.get()` so service keys apply live; shared
  keys such as `consumerPrefetch` apply at restart).
- Do not add Redis or Sentry unless explicitly requested.

## Service layout

```
src/
  index.ts        startup: runtime.start (serve + Consul registration), outbox relay, consumers
  app.ts          route mounting: public /api/*, internal routes, /openapi.json
  env.ts          secrets and bootstrap addresses (@t3-oss/env-core)
  config.ts       Consul KV configuration schema
  runtime.ts      createRuntime(<service>, env)
  db/             data store client and schema (Drizzle + migrations, or MongoDB + setup.ts)
  modules/<feature>/
    <feature>.routes.ts            public routes
    <feature>.internal.routes.ts   internal routes (describeRoute({ hide: true }))
    <feature>.service.ts           business logic, never receives a Hono Context
    <feature>.schemas.ts           Zod schemas
    <feature>.index.ts             the module's public exports
drizzle/          this service's migrations
test/env.ts       test env values (also preloaded by scripts/openapi.ts)
test/setup.ts     bunfig.toml preloads it: test/env.ts, and for Postgres services swap `@/db` for an
                  in-process PGlite with the real migrations (test/db.ts), emptied before each test
```

## Hono and module rules

- Use `factory.createApp()` for routers and `factory.createMiddleware()` for middleware.
- Handlers are thin and use `c.req.valid()`.
- Middleware order: `requireSession`, `requireRole`, `validator`, handler.
- Cross-module imports go through `<feature>.index.ts`.
- Services throw `DomainError` subclasses; `createServiceApp` maps them to JSON. A failing peer
  (`UpstreamError`) becomes 503.
- Build events with `event()` and read payloads with `dataOf()` from `@seapedia/contracts/events`;
  never parse `envelope.data` with a local schema.
- A new event subscription is a routing key in the `subscriptions` list of
  `infra/rabbitmq/init.ts` plus a handler in the service's consumer; services declare no queues.
- Event handlers must be idempotent: guard replica writes by `version`, and record non-idempotent
  effects in the inbox in the same transaction.
- Derive types from Drizzle tables or Zod schemas.

## OpenAPI rules

- Every public route has `describeRoute` with a stable `operationId`.
- `scripts/openapi.ts` loads each service's app offline (test environment) and merges their
  `/openapi.json` into `apps/web/public/openapi.json`; a path or schema name defined twice with a
  different shape fails the merge. Keep schema ids (`.meta({ id })`) unique across services. The
  file and the generated SDK are committed; CI fails when they are stale.
- The web SDK is generated from that file: `cd apps/web && rtk bun run openapi:generate`.

## Database rules

- Each service owns its data store server; never reference another service's data.
- Postgres services: schema in `src/db/schema/`, `rtk bun run db:generate` creates a migration,
  `bun run start` applies it. catalog (MongoDB): document types in `src/db/index.ts`, indexes in
  `src/db/setup.ts`.

## Checklist

- [ ] `rtk bun run check`, `rtk bun run fl`, `rtk bun test` pass.
- [ ] New public route added to `infra/kong/kong.yml.tmpl`.
- [ ] Writes that other services depend on enqueue a full-state, versioned event in the same transaction.
- [ ] `bun scripts/openapi.ts` still merges.
