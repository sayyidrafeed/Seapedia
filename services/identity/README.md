# identity

Owns accounts, roles, sessions, and every token in the system. Store: Postgres (`identity-db`):
`users`, `user_role`, `sessions` (one per device), `refresh_tokens` (hashed, rotated), `outbox`.

| Public (via Kong) | Service-to-service |
| --- | --- |
| `POST /api/auth/register`, `login`, `refresh`, `logout` | `POST /oauth/token`: client credentials → scoped service token (policy in `modules/oauth/oauth.policy.ts`) |
| `GET /api/auth/me`, `session`, `me/financial-summary`; `POST /api/auth/select-role`, `onboard` | |
| `/api/users/me` profile and avatar upload; `/api/private/*` role demo | |
| `GET /.well-known/jwks.json` | |

Publishes: `identity.user.registered`, `identity.user.updated`, `identity.session.revoked`.
Consumes: nothing. Config (Consul): token lifetimes. Secrets: `JWT_PRIVATE_KEY`, the other
services' client secrets (`SERVICE_CLIENT_SECRETS`). See `docs/architecture/security.md`.
