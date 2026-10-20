# catalog

Owns stores, products, product reviews and app reviews. Store: MongoDB (`catalog-db`, single-node
replica set for transactions); indexes are ensured at startup (`src/db/setup.ts`).

Replicas it keeps from events: `users` (reviewer names, from identity), `purchases` (review gate,
from `commerce.order.completed`), and on `products`: `stock` (from `commerce.inventory.changed`)
and `soldCount` (from `commerce.order.completed`, deduped by `inbox`).

| Public (via Kong)                                                                                      | Service-to-service                                                                   |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `/api/products` listing, detail, image upload; `/api/products/:id/reviews`, `/api/products/reviews/me` | `GET /internal/search/documents/export` (scope `catalog:export`, for search reindex) |
| `/api/seller/products` CRUD                                                                            |                                                                                      |
| `/api/stores`, `/api/reviews`                                                                          |                                                                                      |

Free-text listing queries call search (scope `search:query`, client-side discovery) for ranked
ids and load them from MongoDB; if search is off (`config/catalog/searchEnabled`) or slower than
`searchTimeoutMs`, the same query runs as a regex on MongoDB.

Publishes: `catalog.store.upserted`, `catalog.product.upserted`, `catalog.product.deleted`.
