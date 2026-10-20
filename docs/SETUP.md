# Seapedia setup

Two ways to run Seapedia locally:

- **Production-like**: every service, Kong, and the infrastructure from their production images,
  with the memory limits planned for the server. Use this to verify before deploying.
- **Development**: infrastructure and Kong in Docker, the services on the host with hot reload.

Deployment is in [DEPLOYMENT.md](./DEPLOYMENT.md); the architecture in
[architecture/overview.md](./architecture/overview.md).

## Prerequisites

- [Bun](https://bun.sh) 1.4.2 (the version in CI and the Dockerfiles)
- Docker with Compose v2, with at least 4 GB of memory for Docker

## Production-like stack

```bash
bun install
bun scripts/generate-secrets.ts > .env.prod.local        # random secrets + RS256 key pair
docker compose -f docker-compose.prod.yml --env-file .env.prod.local up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.prod.local --profile tools run --rm seed
bun run smoke                                            # end-to-end checks through Kong
bun run smoke -- --resilience                            # also stops RabbitMQ, Elasticsearch, catalog
```

| What | URL |
| --- | --- |
| Web app (and `/docs`) | http://localhost:8080 (`WEB_PORT`) |
| API through Kong | http://localhost:3001 |
| Consul UI | http://localhost:8500 |
| RabbitMQ management | http://localhost:15672 (user `admin`, password `RABBITMQ_ADMIN_PASSWORD`) |

## Development

```bash
bun install
bun scripts/generate-secrets.ts --dev      # writes services/*/.env, infra/seed/.env, infra/kong/.env once
docker compose up -d                       # Consul, RabbitMQ, 2× Postgres, MongoDB, Elasticsearch, Kong
for s in identity commerce; do (cd services/$s && bun run db:migrate); done
bun run dev                                # identity, catalog, commerce, search, web with hot reload
bun run seed                               # demo data; wipes the databases, rebuilds the search index
```

Services register in Consul as `host.docker.internal`, so Kong (in Docker) reaches them on the host.
The web app runs at http://localhost:5173 and calls Kong at http://localhost:3001.

Demo accounts are in [SEED-DATA.md](./SEED-DATA.md); every password is `password123`.

`--dev` never overwrites an existing `.env`. A `.env` left over from the old monolith (for example
`services/commerce/.env`) must be moved away first, or it keeps the old settings.

## Configuration

Secrets and bootstrap addresses come from each service's environment (`src/env.ts`,
`.env.example`). Tunables come from Consul KV and apply without a restart:

```bash
docker compose exec consul consul kv get -recurse config/
docker compose exec consul consul kv put config/catalog/searchEnabled false   # search falls back to MongoDB
docker compose exec consul consul kv put config/commerce/deliveryFees '{"instant":35000,"next_day":15000,"regular":10000}'
```

See [architecture/platform.md](./architecture/platform.md).

## Public API contract

The web SDK and `/docs` read `apps/web/public/openapi.json`, merged from the running services:

```bash
bun scripts/openapi.ts                      # finds the services through Consul
cd apps/web && bun run openapi:generate
```

## Commands

| Command | What it does |
| --- | --- |
| `bun run check` | type-check every workspace |
| `bun run fl` | format and lint every workspace |
| `bun run test` | unit tests of the services and `packages/platform` |
| `bun run seed` | wipe and seed the three databases, rebuild search |
| `bun run smoke` | end-to-end checks against a running stack |
| `cd services/<identity or commerce> && bun run db:generate` | create a Postgres migration |
