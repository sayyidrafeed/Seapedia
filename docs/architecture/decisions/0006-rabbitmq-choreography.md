# 0006: Choreography over RabbitMQ with outbox, inbox and full-state events

Status: accepted (2026-10). Supersedes 0003.

## Context

Phase 1 pulled thin events over HTTP: consumers polled producers and called them back for state.
Producers had to be up for events to flow, consumers were hard-coded in producers, and several
user requests made synchronous cross-service calls.

## Decision

- RabbitMQ topic exchange `seapedia.events`; routing key `<service>.<entity>.<event>`.
- Producers keep the transactional outbox; an in-process relay publishes with publisher confirms.
- Events carry full current state and a version (event-carried state transfer). Consumers keep
  local replicas and never call producers back.
- One durable queue per consuming service, retry via TTL queue and per-queue redelivery, parking
  after 5 attempts. Version guards and an inbox make handlers idempotent.
- No orchestrator: each service reacts to the events it cares about.

## Consequences

- The review gate, reviewer names, admin counts, stock and prices are local reads.
- RabbitMQ is another component to run (about 0.15 GB, estimated before measurement).
- Replicas are eventually consistent; 409 `PRODUCT_SYNCING` covers the creation gap.
