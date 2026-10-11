# Communication

## Gateway and identity

The browser talks only to the gateway. The gateway removes any identity headers the client sent,
resolves the `__session` cookie with identity (`POST /internal/sessions/introspect`), and forwards
the request to the owning service with:

| Header | Value |
| --- | --- |
| `x-user-id`, `x-session-id`, `x-active-role` | the resolved session, absent for anonymous requests |
| `authorization` | `Bearer <INTERNAL_API_TOKEN>` |
| `x-request-id` | generated or passed through, logged by every service |

Introspection results are cached for `SESSION_CACHE_TTL_MS` (5 s). The gateway drops a token's
entry whenever identity handles a non-GET request with that cookie (login, logout, role switch,
onboarding), so those take effect on the next request. A session deleted some other way stays
usable for at most the TTL.

Services reject any request without the internal token (`requireInternal`), so the identity
headers can only come from the gateway or another service. `requireSession` and `requireRole`
read those headers; each service decides authorization itself.

## Internal calls

Services call each other with `createInternalClient` (`packages/platform`): bearer token, timeout,
`x-request-id` propagation, and Zod validation of the response. Internal routes live under
`/internal/*`, are hidden from OpenAPI, and the gateway never routes them.

| Caller | Callee | Call | If the callee is down |
| --- | --- | --- | --- |
| gateway | identity | `POST /internal/sessions/introspect` | requests carrying a session cookie get 503 (after the 5 s cache); anonymous browsing still works |
| catalog | search | `GET /search/products` | catalog searches with ILIKE instead |
| catalog | commerce | `GET /internal/purchases/check` | posting a review fails with 503 |
| catalog | identity | `GET /internal/users` | posting a review fails with 503 |
| commerce | catalog | `GET /internal/products`, `GET /internal/stores` | only a product never seen before fails to add to a cart |
| commerce | identity, catalog | `GET .../stats` | the admin dashboard returns 503 |

## Events: transactional outbox with pull

A producer writes its event into its own `outbox` table in the same database transaction as the
change, one row per subscribed consumer. A consumer polls `GET /internal/outbox/<consumer>`,
applies the batch, then acknowledges it with `POST /internal/outbox/<consumer>/ack`, which deletes
those rows.

| Producer | Topic | Entity | Consumers | Consumer action |
| --- | --- | --- | --- | --- |
| catalog | `product` | product id | search, commerce | re-read the product; upsert, or delete if catalog no longer has it |
| catalog | `store` | store id | search, commerce | re-read the store (search re-indexes all its products) |
| commerce | `inventory` | product id | catalog | copy current stock into `products.stock` |
| commerce | `sales` | product id | catalog | copy units sold in completed orders into `products.sold_count` |

Properties that follow from this design:

- **No lost events.** The event commits or rolls back with the change. There is no window where
  the database changed but publishing failed.
- **At-least-once delivery.** A consumer acks only after it applied the batch. A crash in between
  replays the batch.
- **Idempotent, order-independent handlers.** Events carry only an id. The consumer always fetches
  the producer's current state, so a replayed or reordered event writes the same result.
- **No skipped events.** Rows are acked by id, not by a "last seen id" checkpoint, so a
  transaction that commits after a higher id was already read is still delivered.
- **One reader per consumer.** Run a single replica of each consuming service's loop.

Without a broker, a consumer that is down simply accumulates rows in the producer's outbox and
catches up when it returns. The search index also has a full rebuild (`POST /search/reindex`) for
bootstrap, mapping changes, or drift.
