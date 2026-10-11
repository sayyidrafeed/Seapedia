# gateway

The only public entry point of the Seapedia API (`api-seapedia.*`, port 3001). It has no database.

For every `/api/*` request it:

1. picks the owning service from the route table in `src/routes.ts` (longest prefix wins);
2. drops any `x-user-id`, `x-session-id`, `x-active-role`, and `authorization` header the client sent;
3. resolves the `__session` cookie with identity's `POST /internal/sessions/introspect` (cached for
   `SESSION_CACHE_TTL_MS`, dropped when identity changes that session);
4. forwards the request with the resolved identity headers and the internal service token.

The gateway authenticates. Each service authorizes (roles, ownership).

| Endpoint            | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `/api/*`            | proxied to identity, catalog, or commerce                       |
| `GET /api/health`   | health of the upstream services (503 if one is down)            |
| `GET /healthz`      | liveness of the gateway itself                                  |
| `GET /openapi.json` | the services' OpenAPI documents merged into one public contract |
| `GET /docs`         | Scalar API reference                                            |

Env: see `.env.example`.
