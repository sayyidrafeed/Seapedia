# 0009: Short access tokens, rotating refresh tokens, per-device sessions

Status: accepted (2026-10).

## Context

Phase 1 used a 2-hour HS256 cookie checked against one shared session row per user, introspected
by the gateway on every request. Logout signed out every device.

## Decision

- RS256 access tokens (10 minutes) that Kong and every service verify locally.
- Opaque refresh tokens (7 days), hashed, rotated on every use; reuse revokes the session.
- One session per device.
- `identity.session.revoked` feeds an in-memory denylist in every service for immediate logout.
- Client-credentials service tokens with audience and scope for service-to-service calls.

## Consequences

- No per-request dependency on identity.
- The web app must refresh on 401 (one shared refresh, then replay).
- A revoked session is denied after broker latency, not instantly at the edge.
