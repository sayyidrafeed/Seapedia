# 0003: Transactional outbox, pulled over HTTP, instead of a message broker

Status: accepted (2026-10)

## Context

Services need to learn about each other's changes (product edits, stock, completed orders). A
broker (Kafka, RabbitMQ, NATS) would add another stateful component to run on a 4 GB host.
Writing to the database and then calling another service in the same request risks one succeeding
without the other.

## Decision

Each producer writes events to an `outbox` table in the same transaction as the change, one row
per subscribed consumer. Consumers poll the producer's internal outbox endpoint and ack rows after
applying them. Events are thin (topic and entity id); consumers re-read current state.

## Consequences

- An event is never lost or published for a rolled-back change.
- Delivery latency is the poll interval (2 s by default).
- Handlers must be idempotent, which thin events make easy.
- Each consumer loop must run as a single replica.
- Moving to a broker later means adding a relay that drains the same outbox tables; producers do
  not change.
