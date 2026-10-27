# Security: authentication and authorization

## Users

| Token | Format | Lifetime | Where |
| --- | --- | --- | --- |
| Access token | RS256 JWT signed by identity: `sub`, `sid`, `roles`, `role` (active), `aud=seapedia-api`, `iss=seapedia-identity` | 10 min (`accessTokenTtlSeconds`) | cookie `__access` (HttpOnly, SameSite=Lax, Secure in production), or `Authorization: Bearer` |
| Refresh token | 256-bit random, stored as SHA-256 in `refresh_tokens` | 7 days (`refreshTokenTtlDays`) | cookie `__refresh`, path `/api/auth` only |

- **Sessions are per device** (`sessions`). Login opens a new one; logout revokes only that one.
- **Refresh rotates.** `POST /api/auth/refresh` marks the presented refresh token used and issues a
  new pair. Presenting a used token again means it leaked: the whole session is revoked.
- **Immediate revocation.** Logging out or a detected reuse publishes `identity.session.revoked`;
  every service instance denies that session's access tokens until they would have expired.
- **Role switch** (`POST /api/auth/select-role`) and onboarding re-issue the access token with the
  new role.
- The web app refreshes once on a 401 and replays the request.

## Layers

| Layer | Checks |
| --- | --- |
| Kong (edge) | Verifies the JWT signature (RS256 public key) and `exp`. Routes that always need a user (commerce, seller products, account) reject missing or invalid tokens with 401; public routes (catalog browsing, locations) let anonymous requests through. Also: CORS, `rate-limiting` (20/min per IP) on login/register/refresh, 1 MB request size limit, request ids. `/internal/*` and `/oauth/*` are never routed. |
| Service (authentication) | Verifies the token again (`authenticate`): issuer, audience, expiry, and the session denylist. A token Kong let through is not trusted blindly. |
| Service (authorization) | `requireSession` and `requireRole(role)` on the active role, then ownership checks in the domain (a seller's own store and products, a buyer's own cart, orders and addresses, a driver's own jobs, admin-only operations). |

### Permission matrix (active role)

| Area | guest | buyer | seller | driver | admin |
| --- | --- | --- | --- | --- | --- |
| Browse catalog, stores, reviews | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cart, wallet, addresses, checkout, own orders, product reviews | | ✓ | | | |
| Own store, products, stock, store orders, income report | | | ✓ | | |
| Delivery jobs (take, complete), earnings | | | | ✓ | |
| Dashboard, vouchers, promos, overdue processing, time simulation | | | | | ✓ |

## Service to service

- **Client credentials.** Each calling service has a secret; identity (`POST /oauth/token`) issues
  a 5-minute RS256 token with `sub=<caller>`, `aud=<callee>`, and the granted `scope`. The policy
  of who may call whom lives in identity (`modules/oauth/oauth.policy.ts`):

  | Caller | Callee | Scope |
  | --- | --- | --- |
  | catalog | search | `search:query` |
  | search | catalog | `catalog:export` |
  | seed (ops) | search | `search:reindex` |

- The callee checks audience and scope with `requireServiceScope`. A user access token is never
  accepted as a service token, and the reverse.

## Broker

Each service has its own RabbitMQ user in vhost `seapedia` (`infra/rabbitmq/init.ts`):

- configure/read/write only on the shared exchanges, its own queues, and server-named queues;
- **topic permission** on `seapedia.events`: it may publish only routing keys starting with its own
  name, so no service can forge another's events.

## Secrets

Secrets come from the environment (Dokploy secrets in production): database passwords, the JWT
private key (identity only), the public key (Kong and services), RabbitMQ passwords, client
secrets. Consul KV holds only non-secret configuration.

## Vulnerability management

- CI fails on any high or critical advisory in the dependency tree (`bun audit --audit-level=high`),
  and images are pinned to exact versions.
- Assessment of 2026-10-27 (no critical advisory affected a pinned image):

  | Component | Was | Now | Why |
  | --- | --- | --- | --- |
  | zod, undici | 4.6.5, 7.30.0 | 4.6.6, 7.30.1 | high: memory exhaustion on oversized input (every service), DoS (search) |
  | tinypool, js-yaml (tooling only) | 2.1.0, 4.1.1 | 2.1.2, 4.3.2 (root `overrides`) | critical / high in the formatter and SDK generator |
  | Bun | 1.4.2 | 1.4.4 | high: brotli decoder out-of-bounds write, distrusted CAs in the root store |
  | RabbitMQ | 4.2.9 | 4.3.7 | high: AMQP memory DoS; 4.2 is out of community support with no public fix |
  | Consul | 2.0.4 | 2.1.0 | HCSEC-2026-46 to 49, including unauthenticated memory DoS on the HTTP API |
  | Elasticsearch | 9.5.3 | 9.5.5 | high privilege escalation (needs `manage_roles`) and authenticated DoS |
  | Kong | 3.9.3 | 3.9.4 | high: SQL injection in hybrid-mode clustering (not used in DB-less mode) |
  | nginx | 1.30.5 | 1.30.6 | medium items only |
  | MongoDB 7.0.45, Postgres 17.11 | | unchanged | no open advisories found |

  Accepted: esbuild 0.18 (moderate, dev-server issue) inside `drizzle-kit`, which never runs a
  dev server.
- Configuration risks a CVE scan does not catch: Elasticsearch HTTP without TLS and Consul without
  ACLs are acceptable only because neither is reachable outside the private Docker network;
  enable Consul ACLs on the VPS.
