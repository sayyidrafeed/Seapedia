# 0004: A small Hono gateway instead of an off-the-shelf proxy

Status: superseded by [0007](./0007-kong-gateway.md)

## Context

The web app needs one origin, one cookie, and one OpenAPI contract to generate its SDK from.
Sessions must be revocable on logout, so a self-contained JWT check at the edge is not enough.

## Decision

`services/gateway` routes `/api/*` by prefix, resolves sessions through identity (short cache,
invalidated on identity writes), strips client-supplied identity headers, and merges the
services' OpenAPI documents. Authorization stays in the services.

## Consequences

- One place enforces "identity headers only come from a verified session".
- Every authenticated request depends on identity being reachable (cached for 5 s).
- Traefik (from Dokploy) still terminates TLS in front of the gateway; it does not route by path.
