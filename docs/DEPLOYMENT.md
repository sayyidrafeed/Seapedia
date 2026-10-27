# Deployment (Dokploy)

Target: one fresh VPS with a fresh Dokploy install (`new-dokploy.sayyidrafee.com`), starting from
seed data. Every service, Kong, and the web app is its own Dokploy application pulled from GHCR and
redeployed by its own webhook, so they release independently.

This is a runbook; nothing in the repository changes the server by itself.

## Memory budget

Target VPS: 4 GB RAM, 2 vCPU, 60 GB disk, with about 1.8 GB already used by the OS and Dokploy.
UNVERIFIED: phase 2 has not been measured yet; limits in `docker-compose.prod.yml` /
`docker-compose.deploy.yml` and estimates:

| Container | Limit | Estimate |
| --- | --- | --- |
| elasticsearch (384 MB heap) | 900 MB | ~700 MB (phase 1 measured ~900 MB with a 512 MB heap) |
| catalog-db (MongoDB 7.0, 0.15 GB cache) | 384 MB | ~200 MB |
| rabbitmq | 256 MB | ~150 MB |
| gateway (Kong, 1 worker) | 192 MB | ~150 MB |
| identity-db, commerce-db (Postgres) | 128 MB each | ~60 MB each |
| consul | 96 MB | ~60 MB |
| identity, catalog, commerce, search | 160 MB each | ~45 MB each (phase 1 measured) |
| web (nginx) | 32 MB | ~12 MB |

Estimate: about 1.6 GB for Seapedia, about 3.4 GB with the OS and Dokploy. Add 2–4 GB of swap
(step 1) and never build images on the server: CI builds them and the server only pulls. Measure
with `docker stats` after the first deploy and update this table.

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
Dokploy secret. CI publishes `ghcr.io/sayyidrafeed/seapedia-<service>` for gateway, identity, catalog, commerce,
search, web and seed: `:<sha>` and `:pr-<n>` from pull requests, `:main` and `:latest` from main. GitHub repository variables:

| Variable | Value |
| --- | --- |
| `PUBLIC_API_URL` | `https://api-seapedia.sayyidrafee.com` (baked into the web image) |
| `PUBLIC_WEB_URL` | `https://seapedia.sayyidrafee.com` |
| `IMAGE_PLATFORMS` | `linux/amd64`, or `linux/arm64` for an ARM VPS |
| `CI_RUNNER` | optional runner label (default `ubuntu-latest`; Blacksmith needs a GitHub organization) |
| `DEPLOY_WEBHOOK_URL_<SERVICE>` | each Dokploy application's deploy webhook |

GHCR packages start private. Either make each `seapedia-*` package public (package settings), or
add GHCR as a registry in Dokploy with a token that has `read:packages`.

## 3. Deploy the stack (Dokploy Compose)

The quickest path is one Dokploy **Compose** application from this repository using
`docker-compose.deploy.yml`: the same stack as `docker-compose.prod.yml`, but every Seapedia image
is pulled from GHCR (`ghcr.io/sayyidrafeed/seapedia-<service>`) and nothing binds host ports.

1. Create a Compose application, source: this GitHub repository, compose path
   `docker-compose.deploy.yml`, branch `main` (or the PR branch while testing).
2. Environment: paste the output of `bun scripts/generate-secrets.ts` (production secrets), then set
   `WEB_URL=https://seapedia.sayyidrafee.com`, `API_URL=https://api-seapedia.sayyidrafee.com`, and
   the image tags: `IDENTITY_TAG`, `CATALOG_TAG`, `COMMERCE_TAG`, `SEARCH_TAG`, `GATEWAY_TAG`,
   `WEB_TAG`, `SEED_TAG` (`main`, a commit SHA, or `pr-<number>` while testing a PR).
3. Domains: `gateway` port 8000 → `api-seapedia.sayyidrafee.com`; `web` port 8080 →
   `seapedia.sayyidrafee.com`.
4. Deploy. Platform init jobs (`consul-init`, `rabbitmq-init`) run once and exit.

Each service still releases on its own: change only its `*_TAG` and redeploy. Splitting into one
Dokploy application per service later is a matter of moving each block into its own application
on the same network.

Rules that matter:

- Services register their container IP in Consul; Kong resolves them through Consul DNS. Check in
  the Consul UI (`ssh -L 8500:localhost:8500`) that every service is passing.
- More replicas work: consumers share their queue, Consul spreads traffic, and two outbox relays
  may publish an event twice, which consumers absorb (version guards, inbox).
- Services apply their own migrations or indexes on start. Rolling back an image does not roll
  back a migration; keep migrations backward compatible.
- Keep Consul, RabbitMQ and the databases without domains; enable Consul ACLs for production.

## 4. Seed and index

Run the seed once from the server (it wipes the databases):

```bash
docker compose -p <dokploy compose project> -f docker-compose.deploy.yml --profile tools run --rm seed
```

It rebuilds the search index through the search service (client `seed`, scope `search:reindex`).

## 5. Cut over

1. `API_URL=https://<new api domain> bun scripts/smoke.ts` against the new stack.
2. Point `seapedia.sayyidrafee.com` at `web` and `api-seapedia.sayyidrafee.com` at `gateway`.
3. Remove `apps/web/public/_redirects` (only Vercel/Netlify read it).
4. Shut down the Vercel project and the old server with its database; treat the old database
   credentials as exposed.

## Rollback

Each application rolls back on its own: redeploy the previous SHA tag. Events are versioned and
consumers ignore older versions, so replaying or reordering after a rollback is safe.
