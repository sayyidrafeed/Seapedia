# 0001: Split the modular monolith into four domain services and a gateway

Status: accepted (2026-10)

## Context

Seapedia started as a modular monolith (one Hono app, one Postgres database). The goals for this
change were production-grade practice and learning how a real microservice system behaves, with
deployment on a single Dokploy host.

## Decision

Split by business capability, each service with its own database and image:

- identity: accounts, roles, sessions
- catalog: stores, products, reviews
- commerce: everything that moves money or stock (cart, wallet, checkout, orders, discounts,
  delivery, admin operations, inventory)
- search: the product search read model (see 0005)
- gateway: the single public entry point (see 0004)

Wallet and fulfilment stay inside commerce because checkout and delivery completion change them
in the same transaction as orders (see 0002).

## Consequences

- No cross-database joins or foreign keys. Data a service needs from another comes from internal
  APIs or replicas fed by the outbox (see 0003).
- Each service is built, tested, and deployed on its own; CI publishes one image per service.
- Local development and production need more moving parts (seven containers instead of three).
