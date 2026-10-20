# 0008: A database per service, chosen per workload

Status: accepted (2026-10).

## Context

Phase 1 ran three databases on one Postgres server: separate data, shared failure domain.

## Decision

Each service gets its own database server:

- identity: Postgres (relational, uniqueness constraints on accounts).
- commerce: Postgres (money and stock need ACID transactions across many tables).
- catalog: MongoDB, a single-node replica set for multi-document transactions. Products, stores
  and reviews are read-heavy documents; public listings join stores with `$lookup`.
- search: Elasticsearch (read model).

## Consequences

- One service's database failing or being overloaded does not affect the others.
- More containers and memory on a single host (to be measured; see DEPLOYMENT.md).
- Catalog has no SQL migrations: indexes are ensured at startup (`db/setup.ts`).
