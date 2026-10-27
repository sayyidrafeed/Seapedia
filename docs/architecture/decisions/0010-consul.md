# 0010: Consul for centralized configuration and hybrid service discovery

Status: accepted (2026-10).

## Context

Configuration was per-service environment variables; services found each other through fixed
Docker hostnames.

## Decision

- Non-secret configuration in Consul KV (`config/shared/*`, `config/<service>/*`), validated per
  service and watched for changes; secrets stay in the environment.
- Services self-register with health checks. Kong discovers upstreams server-side through Consul
  DNS; internal calls discover instances client-side through the health API with round-robin.

## Consequences

- Tunables (timeouts, fees, search switch, token lifetimes) change without a redeploy.
- Scaling a service is starting another instance; callers pick it up within seconds.
- Consul is another component (about 50–80 MB, estimated before measurement) and must be up for
  services to start.
