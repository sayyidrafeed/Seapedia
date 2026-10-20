# 0007: Kong as the API gateway

Status: accepted (2026-10). Supersedes 0004.

## Context

The custom gateway introspected sessions on identity for every request and merged OpenAPI specs.
A standard gateway with declarative configuration and stateless token checks is the
industry-default edge for microservices.

## Decision

Kong 3.9 OSS in DB-less mode (`infra/kong/kong.yml.tmpl`): routes by path prefix to upstreams
resolved through Consul DNS; the jwt plugin verifies identity's RS256 access tokens (strict on
routes that always need a user, anonymous allowed on public catalog routes); CORS, rate limiting on
credential endpoints, request size limit, correlation ids. The merged OpenAPI document is built by
`scripts/openapi.ts` and served with Scalar by the web app at `/docs`.

## Consequences

- No per-request call to identity. Logout takes effect through `identity.session.revoked` and
  every service's denylist, not through Kong.
- Kong's JWT check is the first line only; services verify again and authorize.
- Route groups in `kong.yml` must follow the services' public routes.
