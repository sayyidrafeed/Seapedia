# identity

Owns accounts, roles, and sessions. Database: `identity` (`users`, `user_role`, `active_session`).

It issues the `__session` cookie (HS256 JWT holding user and session ids) and is the only service
that validates it, through the introspection endpoint the gateway calls.

| Public (`/api`)                                                 | Internal (`/internal`)                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `auth/*` register, login, logout, onboard, session, select-role | `POST sessions/introspect` token to `{ active, userId, sessionId, activeRole }` |
| `users/me` profile and avatar upload                            | `GET users?ids=` display names (no emails)                                      |
| `private/*` role-guard demo endpoints                           | `GET users/stats` counts for the admin dashboard                                |

Events: none published, none consumed. Env: see `.env.example`.
