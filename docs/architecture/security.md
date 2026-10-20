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
