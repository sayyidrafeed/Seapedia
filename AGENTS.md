# Seapedia agent guide

Seapedia is a set of microservices in one repository (bun workspace). Read
`docs/architecture/overview.md` before changing anything that crosses a service.

## Layout

| Path | What it is |
| --- | --- |
| `apps/web` | React SPA. Talks only to Kong. See `apps/web/AGENTS.md`. |
| `services/identity` | Users, roles, sessions, tokens, service credentials. Postgres `identity-db`. |
| `services/catalog` | Stores, products, reviews. MongoDB `catalog-db`. |
| `services/commerce` | Cart, wallet, orders, discounts, delivery, admin, stock. Postgres `commerce-db`. |
| `services/search` | Elasticsearch read model of the catalog. |
| `packages/platform` | Technical code shared by services (auth, events, Consul, errors). No business rules. |
| `infra/kong` | API gateway (Kong DB-less config + image). |
| `infra/consul`, `infra/rabbitmq`, `infra/mongo` | Platform bootstrap (KV defaults, broker users, replica set). |
| `infra/seed` | Ops tool that seeds the three databases. |

## Boundary rules

- A service never imports another service's code. The only exception is `infra/seed`, an ops tool.
- A service reads and writes only its own data store. Data owned elsewhere comes from a local
  replica fed by the owner's events, never from a call to the owner.
- A write that other services depend on enqueues an event in the same transaction
  (`identityOutbox.enqueue`, catalog `enqueue(session, ...)`, `commerceOutbox.enqueue`). Events
  carry full state and the entity `version`; consumers apply only newer versions.
- The only synchronous service-to-service calls are catalog → search (query) and search →
  catalog (reindex export), each with a scoped client-credentials token. Adding another needs an
  ADR.
- Public routes live under `/api/*` and must be added to `infra/kong/kong.yml.tmpl` in the right
  group (strict JWT or anonymous allowed). Internal routes use `describeRoute({ hide: true })` and
  `requireServiceScope`.
- Non-secret tunables go in Consul (`infra/consul/init.sh` + the service's `config.ts`); secrets
  stay in the environment.

## Commands

| Task | Command |
| --- | --- |
| Install | `rtk bun install` |
| Dev secrets (once) | `rtk bun scripts/generate-secrets.ts --dev` |
| Dev infrastructure + Kong | `docker compose up -d` |
| Run all apps with hot reload | `rtk bun run dev` |
| Check, lint, test everything | `rtk bun run check`, `rtk bun run fl`, `rtk bun run test` |
| Seed | `rtk bun run seed` (wipes the three databases, rebuilds search) |
| Public API contract | `rtk bun scripts/openapi.ts` then `cd apps/web && rtk bun run openapi:generate` |
| Production-like stack | see `docs/SETUP.md` |
| End-to-end smoke | `rtk bun run smoke` |
