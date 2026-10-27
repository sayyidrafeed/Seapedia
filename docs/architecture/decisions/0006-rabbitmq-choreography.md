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
- Event payloads have one definition, `packages/contracts`, validated when an event is built and
  when it is read. A shared schema package couples producer and consumer at build time; that is
  accepted because the coupling already exists on the wire, and it turns a silent drift into a
  type error. It holds integration shapes only, no business rules.

## Consequences

- The review gate, reviewer names, admin counts, stock and prices are local reads.
- RabbitMQ is another component to run (about 0.15 GB, estimated before measurement).
- Replicas are eventually consistent. Stock set during the creation gap is kept as pending and
  applied on arrival; adding a not-yet-replicated product to a cart answers 409 `PRODUCT_SYNCING`.
- Each consuming service keeps its own replica of the same upstream entity (commerce and catalog
  both hold users, for example). That duplication is the price of never calling the owner, and
  each replica holds only the fields its owner needs.
