# Communication

## Choreography over RabbitMQ

Services react to each other's events; nothing orchestrates them. All events go to the topic
exchange `seapedia.events` with routing key `<service>.<entity>.<event>`, as an envelope:

```json
{ "id": "uuid", "type": "catalog.product.upserted", "source": "catalog",
  "occurredAt": "2026-10-20T10:00:00Z", "version": 7, "data": { "...": "full current state" } }
```

Events carry the producer's full current state (event-carried state transfer), so consumers never
call the producer back.

| Event | Producer | Consumers and their reaction |
| --- | --- | --- |
| `identity.user.registered`, `identity.user.updated` | identity | catalog: display-name replica · commerce: `user_refs` |
| `identity.session.revoked` | identity | every service instance: deny that session's access tokens |
| `catalog.store.upserted` | catalog | commerce: `store_refs` · search: store lookup + rename in documents |
| `catalog.product.upserted` | catalog | commerce: `product_refs` + `inventory` row · search: index document |
| `catalog.product.deleted` | catalog | commerce: drop ref (cascades cart items) · search: tombstone |
| `commerce.inventory.changed` | commerce | catalog: stock read model |
| `commerce.order.completed` | commerce | catalog: purchases (review gate) + sold counts → `catalog.product.upserted` |

### Delivery

- **Transactional outbox.** A producer writes the event into its own `outbox` (Postgres table or
  Mongo collection) in the same transaction as the change. A relay in the producer process
  publishes pending events with **publisher confirms** and only then marks them published. No
  change is lost and no event is sent for a rolled-back change.
- **At-least-once.** Each consuming service has one durable queue (`identity` excepted: it consumes
  nothing). Messages are acked after the handler commits.
- **Retries without fan-out.** A failed message is dead-lettered to `seapedia.retry` →
  `<queue>.retry` (TTL 5 s) → `seapedia.redeliver` → back to the same queue only. After 5 attempts
  it is moved to `<queue>.parked` for inspection.
- **Idempotent consumers.** Version guards and the inbox (see
  [data ownership](./data-ownership.md#ordering-and-duplicates)) make redeliveries and reordering
  harmless.
- **Session revocations** use an exclusive, auto-deleted queue per instance, so every replica of
  every service updates its in-memory denylist.

Producers keep working when RabbitMQ is down: events wait in their outbox and are published when
the broker returns.

## Synchronous calls (the only ones)

| Caller | Callee | Call | If the callee is down |
| --- | --- | --- | --- |
| browser | Kong → services | `/api/*` | that service's routes return 502/503 |
| Kong | Consul DNS | resolve `<service>.service.consul` | routing fails |
| catalog | search | `GET /search/products` (scope `search:query`, client-side discovery) | catalog searches its own data (regex) |
| search (reindex) | catalog | `GET /internal/search/documents/export` (scope `catalog:export`) | reindex retries; incremental sync continues from events |
| services | identity | `POST /oauth/token` (client credentials, cached ~5 min) | the service-to-service call above fails |

Everything else (review gate, reviewer names, admin counts, stock, prices) is answered from local
replicas.

## Service-to-service HTTP

Internal routes live under `/internal/*` or a service's own internal prefix, are hidden from
OpenAPI, are never routed by Kong, and require a service token with the right scope
(`requireServiceScope`). See [security](./security.md#service-to-service).
