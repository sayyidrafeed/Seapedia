# Seapedia agent guide

Seapedia is a set of microservices in one repository (bun workspace). Read
`docs/architecture/overview.md` before changing anything that crosses a service.

## Layout

| Path | What it is |
| --- | --- |
| `apps/web` | React SPA. Talks only to the gateway. See `apps/web/AGENTS.md`. |
| `services/gateway` | Public entry point: routing, session introspection, merged OpenAPI. |
| `services/identity` | Users, roles, sessions. Database `identity`. |
| `services/catalog` | Stores, products, reviews. Database `catalog`. |
| `services/commerce` | Cart, wallet, orders, discounts, delivery, admin, inventory. Database `commerce`. |
| `services/search` | Elasticsearch read model of the catalog. |
| `packages/platform` | Technical code shared by services. No business rules. |
| `infra/seed` | Ops tool that seeds the three databases. |
| `infra/postgres` | Database-per-service bootstrap. |

## Boundary rules

- A service never imports another service's code. The only exception is `infra/seed`, an ops tool.
- A service reads and writes only its own database. Data owned elsewhere comes from that
  owner's internal HTTP API or from a local replica fed by the owner's outbox.
- Writes another service depends on go through the owner's outbox, in the same transaction as
  the change (`catalogOutbox.enqueue(tx, ...)`, `commerceOutbox.enqueue(tx, ...)`). Adding a
  write path that changes a product, store, stock, or sales without enqueueing is a bug.
- Events are thin (topic + entity id). Consumers re-read current state from the producer.
- Public routes live under `/api/*` and must be added to the gateway route table
  (`services/gateway/src/routes.ts`). Internal routes live under `/internal/*`, use
  `describeRoute({ hide: true })`, and are never routed by the gateway.
- `packages/platform` holds errors, OpenAPI helpers, storage, internal auth and client, and the
  outbox. Prices, stock rules, and order rules never go there.

## Commands

| Task | Command |
| --- | --- |
| Install | `rtk bun install` |
| Dev infrastructure | `docker compose up -d` |
| Run all apps with hot reload | `rtk bun run dev` |
| Check, lint, test everything | `rtk bun run check`, `rtk bun run fl`, `rtk bun run test` |
| Seed | `rtk bun run seed` (wipes the three databases) |
| Production-like stack | see `docs/SETUP.md` |
| End-to-end smoke | `rtk bun run smoke` |
