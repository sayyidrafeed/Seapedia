# Deployment (Dokploy)

Target: one fresh VPS with a fresh Dokploy install (`new-dokploy.sayyidrafee.com`), starting from
seed data. Each service is its own Dokploy application, pulled from GHCR and redeployed by its own
webhook, so services release independently.

This is a runbook. Nothing in this repository changes the server by itself.

## Memory budget

Measured with `docker stats` on the production-like compose stack (seed data, idle after the smoke
test, 2026-10-11):

| Container | Measured | Limit |
| --- | --- | --- |
| elasticsearch (512 MB heap) | 893 MB | 1200 MB |
| postgres (3 databases) | 114 MB | 384 MB |
| catalog | 45 MB | 192 MB |
| commerce | 41 MB | 192 MB |
| identity | 41 MB | 192 MB |
| search | 40 MB | 192 MB |
| gateway | 27 MB | 128 MB |
| web (nginx) | 12 MB | 32 MB |
| **Total** | **about 1.2 GB** | |

Dokploy itself (UI, its Postgres and Redis, Traefik) needs roughly 1 GB more; that figure is an
estimate, not measured. A 4 GB VPS with 2 GB swap leaves headroom. Recheck with `docker stats`
after the first deploy.

## 1. Prepare the server

```bash
# Elasticsearch refuses to start in production mode without this
echo 'vm.max_map_count=262144' | sudo tee /etc/sysctl.d/99-elasticsearch.conf && sudo sysctl --system
# swap as a safety net
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
# Dokploy (see docs.dokploy.com for the current command)
curl -sSL https://dokploy.com/install.sh | sh
```

Point `new-dokploy.sayyidrafee.com` at the server and set it as the Dokploy panel domain.

## 2. Images and registry

CI publishes `ghcr.io/sayyidrafeed/seapedia-<service>:<commit-sha>` (also `:main` and `:latest`)
for gateway, identity, catalog, commerce, search, and web. Set these GitHub repository variables:

| Variable | Value |
| --- | --- |
| `PUBLIC_API_URL` | `https://api-seapedia.sayyidrafee.com` (baked into the web image) |
| `PUBLIC_WEB_URL` | `https://seapedia.sayyidrafee.com` |
| `IMAGE_PLATFORMS` | `linux/amd64`, or `linux/arm64` for an ARM VPS |
| `DEPLOY_WEBHOOK_URL_<SERVICE>` | each Dokploy application's deploy webhook (step 4) |

In Dokploy, add GHCR as a registry with a token that can read packages.

## 3. Infrastructure

In one Dokploy project/environment (`Seapedia / production`), all on the same Docker network:

| Card | Type | Notes |
| --- | --- | --- |
| `postgres` | Compose or Application, `postgres:17.11-alpine` | volume for data; mount `infra/postgres/init/01-service-databases.sh` into `/docker-entrypoint-initdb.d`; env `POSTGRES_PASSWORD`, `IDENTITY_DB_PASSWORD`, `CATALOG_DB_PASSWORD`, `COMMERCE_DB_PASSWORD` |
| `elasticsearch` | Application, `elasticsearch:9.5.3` | volume for data; env as in `docker-compose.prod.yml` (`discovery.type=single-node`, `ES_JAVA_OPTS=-Xms512m -Xmx512m`, `ELASTIC_PASSWORD`, security on, HTTP TLS off); memory limit 1200 MB; no domain |

The init script runs only when the Postgres volume is empty. It creates one database and one login
role per service.

## 4. Services

One Application per service, provider Docker image, tag pinned to a commit SHA. Internal hostnames
below assume Dokploy's service names; use whatever Dokploy shows for each card.

| Card | Image | Domain | Env (besides `INTERNAL_API_TOKEN`) | Memory |
| --- | --- | --- | --- | --- |
| `gateway` | `seapedia-gateway` | `api-seapedia.sayyidrafee.com` → port 3001 | `IDENTITY_SERVICE_URL`, `CATALOG_SERVICE_URL`, `COMMERCE_SERVICE_URL`, `FRONTEND_URL=https://seapedia.sayyidrafee.com`, `PUBLIC_API_URL` | 128 MB |
| `identity` | `seapedia-identity` | none | `DATABASE_URL=postgres://identity:...@postgres:5432/identity`, `JWT_SECRET`, `R2_*` | 192 MB |
| `catalog` | `seapedia-catalog` | none | `DATABASE_URL` (catalog), `IDENTITY_SERVICE_URL`, `COMMERCE_SERVICE_URL`, `SEARCH_SERVICE_URL`, `R2_*` | 192 MB |
| `commerce` | `seapedia-commerce` | none | `DATABASE_URL` (commerce), `IDENTITY_SERVICE_URL`, `CATALOG_SERVICE_URL` | 192 MB |
| `search` | `seapedia-search` | none | `CATALOG_SERVICE_URL`, `ELASTICSEARCH_URL`, `ELASTICSEARCH_PASSWORD` | 192 MB |
| `web` | `seapedia-web` | `seapedia.sayyidrafee.com` → port 8080 | none (built in) | 32 MB |

Rules that matter:

- Use the internal hostname and the container port between services, never `localhost`.
- Only `gateway` and `web` get domains. The internal services must stay unreachable from outside;
  the token check is the second line of defence, not the first.
- Run exactly one replica of catalog, commerce, and search: each runs an outbox consumer loop.
- Services apply their own migrations on start (`bun run start`). Rolling back an image does not
  roll back a migration; make migrations backward compatible.
- Copy each application's deploy webhook into the matching `DEPLOY_WEBHOOK_URL_<SERVICE>` variable.

## 5. Seed and index

After the services are healthy, run the seed image once (Dokploy one-off container, or on the
server):

```bash
docker run --rm --network <dokploy-network> \
  -e IDENTITY_DATABASE_URL=postgres://identity:...@postgres:5432/identity \
  -e CATALOG_DATABASE_URL=postgres://catalog:...@postgres:5432/catalog \
  -e COMMERCE_DATABASE_URL=postgres://commerce:...@postgres:5432/commerce \
  -e SEARCH_REINDEX_URL=http://search:4004/search/reindex \
  -e INTERNAL_API_TOKEN=... \
  ghcr.io/sayyidrafeed/seapedia-seed:<sha>
```

The seed wipes all three databases. Build the seed image with
`docker build -f infra/seed/Dockerfile -t ghcr.io/sayyidrafeed/seapedia-seed:<sha> .` (CI does
not publish it).

## 6. Cut over

1. Run `API_URL=https://<temporary gateway domain> bun scripts/smoke.ts` against the new stack.
2. Point `seapedia.sayyidrafee.com` at `web` and `api-seapedia.sayyidrafee.com` at `gateway`.
3. Remove `apps/web/public/_redirects` (only Vercel/Netlify read it; nginx has its own SPA fallback).
4. Shut down the Vercel project and the old Dokploy server and its database. The old database
   credentials should be treated as exposed and rotated or destroyed.

## Rollback

Each application rolls back on its own: redeploy the previous SHA tag. Check that the previous
image tolerates the current schema first (see the migration rule above).
