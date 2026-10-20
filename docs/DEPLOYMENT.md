# Deployment (Dokploy)

Target: one fresh VPS with a fresh Dokploy install (`new-dokploy.sayyidrafee.com`), starting from
seed data. Every service, Kong, and the web app is its own Dokploy application pulled from GHCR and
redeployed by its own webhook, so they release independently.

This is a runbook; nothing in the repository changes the server by itself.

## Memory budget

UNVERIFIED: phase 2 (Kong, RabbitMQ, Consul, MongoDB, two Postgres) has not been measured yet.
Limits in `docker-compose.prod.yml`, and estimates:

| Container | Limit | Estimate |
| --- | --- | --- |
| elasticsearch (512 MB heap) | 1200 MB | ~900 MB (measured in phase 1) |
| catalog-db (MongoDB, 0.25 GB cache) | 512 MB | ~250 MB |
| rabbitmq | 384 MB | ~150 MB |
| gateway (Kong, 1 worker) | 256 MB | ~150 MB |
| identity-db, commerce-db (Postgres) | 192 MB each | ~60 MB each |
| consul | 128 MB | ~60 MB |
| identity, catalog, commerce, search | 192 MB each | ~45 MB each (measured in phase 1) |
| web (nginx) | 32 MB | ~12 MB |

Total estimate: about 1.9 GB, plus Dokploy (about 1 GB, estimated). Re-measure with `docker stats`
on the production-like stack before buying the VPS, and update this table.

## 1. Prepare the server

```bash
echo 'vm.max_map_count=262144' | sudo tee /etc/sysctl.d/99-elasticsearch.conf && sudo sysctl --system
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
curl -sSL https://dokploy.com/install.sh | sh     # check docs.dokploy.com for the current command
```

Point `new-dokploy.sayyidrafee.com` at the server and set it as the panel domain.

## 2. Secrets and images

Generate production secrets once (`bun scripts/generate-secrets.ts`) and store each value as a
Dokploy secret. CI publishes `ghcr.io/sayyidrafeed/seapedia-<service>:<sha>` for gateway, identity,
catalog, commerce, search, and web. GitHub repository variables:

| Variable | Value |
| --- | --- |
| `PUBLIC_API_URL` | `https://api-seapedia.sayyidrafee.com` (baked into the web image) |
| `PUBLIC_WEB_URL` | `https://seapedia.sayyidrafee.com` |
| `IMAGE_PLATFORMS` | `linux/amd64`, or `linux/arm64` for an ARM VPS |
| `DEPLOY_WEBHOOK_URL_<SERVICE>` | each Dokploy application's deploy webhook |

Add GHCR as a registry in Dokploy with a token that can read packages.

## 3. Platform and data stores

All in one Dokploy project and one Docker network. None of these get a public domain.

| Card | Image | Notes |
| --- | --- | --- |
| consul | `hashicorp/consul:2.0.4` | command and volume as in `docker-compose.prod.yml`; run `infra/consul/init.sh` once (one-off container) to seed KV |
| rabbitmq | `rabbitmq:4.2.9-management-alpine` | volume; then run `infra/rabbitmq/init.ts` once (`oven/bun` one-off) to create the vhost and per-service users |
| identity-db, commerce-db | `postgres:17.11-alpine` | one each, own volume and password |
| catalog-db | `mongo:8.0.34` | entrypoint and healthcheck from `infra/mongo` (single-node replica set with keyfile auth); user script creates the `catalog` user |
| elasticsearch | `elasticsearch:9.5.3` | single node, 512 MB heap, security on, HTTP TLS off (private network) |

For production, enable Consul ACLs and keep its UI private.

## 4. Services and edge

| Card | Image | Domain | Notes |
| --- | --- | --- | --- |
| gateway | `seapedia-gateway` (Kong) | `api-seapedia.sayyidrafee.com` → 8000 | env `JWT_PUBLIC_KEY`, `CORS_ORIGINS=https://seapedia.sayyidrafee.com`, `CONSUL_DNS_HOST=<consul service name>` |
| web | `seapedia-web` | `seapedia.sayyidrafee.com` → 8080 | also serves `/docs` |
| identity | `seapedia-identity` | none | `DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `SERVICE_CLIENT_SECRETS`, `RABBITMQ_URL`, `CONSUL_HTTP_ADDR`, `R2_*` |
| catalog | `seapedia-catalog` | none | `MONGODB_URL`, `SERVICE_CLIENT_SECRET`, `JWT_PUBLIC_KEY`, `RABBITMQ_URL`, `CONSUL_HTTP_ADDR`, `R2_*` |
| commerce | `seapedia-commerce` | none | `DATABASE_URL`, `JWT_PUBLIC_KEY`, `RABBITMQ_URL`, `CONSUL_HTTP_ADDR` |
| search | `seapedia-search` | none | `ELASTICSEARCH_*`, `SERVICE_CLIENT_SECRET`, `JWT_PUBLIC_KEY`, `RABBITMQ_URL`, `CONSUL_HTTP_ADDR` |

Rules that matter:

- Services register their container IP in Consul; Kong resolves them through Consul DNS. Check in
  the Consul UI that every service is passing before cutting over.
- Run one replica of each service to start. More replicas work: consumers share their queue,
  Consul spreads traffic, and two outbox relays may publish an event twice, which consumers absorb
  (version guards, inbox).
- Services apply their own migrations or indexes on start. Rolling back an image does not roll
  back a migration; keep migrations backward compatible.

## 5. Seed and index

Build and run the seed image once (it wipes the databases):

```bash
docker build -f infra/seed/Dockerfile -t seapedia-seed .
docker run --rm --network <dokploy-network> \
  -e IDENTITY_DATABASE_URL=... -e COMMERCE_DATABASE_URL=... -e CATALOG_MONGODB_URL=... \
  -e CONSUL_HTTP_ADDR=http://<consul>:8500 -e SEED_CLIENT_SECRET=... seapedia-seed
```

It rebuilds the search index through the search service (client `seed`, scope `search:reindex`).

## 6. Cut over

1. `API_URL=https://<new api domain> bun scripts/smoke.ts` against the new stack.
2. Point `seapedia.sayyidrafee.com` at `web` and `api-seapedia.sayyidrafee.com` at `gateway`.
3. Remove `apps/web/public/_redirects` (only Vercel/Netlify read it).
4. Shut down the Vercel project and the old server with its database; treat the old database
   credentials as exposed.

## Rollback

Each application rolls back on its own: redeploy the previous SHA tag. Events are versioned and
consumers ignore older versions, so replaying or reordering after a rollback is safe.
