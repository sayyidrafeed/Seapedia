# Data ownership

Every piece of data has exactly one owner. Other services never query it; they keep a replica fed
by the owner's events.

| Service | Store | Data |
| --- | --- | --- |
| identity | Postgres `identity-db` | `users`, `user_role`, `sessions`, `refresh_tokens`, `outbox` |
| catalog | MongoDB `catalog-db` | `stores`, `products`, `product_reviews`, `app_reviews`, replicas `users`, `purchases`; `outbox`, `inbox` |
| commerce | Postgres `commerce-db` | wallets, addresses, carts, orders, discounts, delivery jobs, `inventory`; replicas `product_refs`, `store_refs`, `user_refs`; `outbox`, `inbox` |
| search | Elasticsearch | `products` alias (documents + tombstones), `products_stores` lookup |

Catalog is document-shaped and read-heavy, so it uses MongoDB (a single-node replica set, which
multi-document transactions need). Money and stock need relational ACID, so commerce uses
Postgres. Identity is relational with uniqueness constraints. Search is a read model in
Elasticsearch. See [ADR 0008](./decisions/0008-polyglot-persistence.md).

User ids appear in catalog and commerce as plain ids; there are no cross-database foreign keys.

## Replicas and read models

| Copy | Lives in | Owner | Fed by | Used for |
| --- | --- | --- | --- | --- |
| `product_refs` (name, slug, price, image, store) | commerce | catalog | `catalog.product.upserted` / `deleted` | cart, checkout prices, order snapshots |
| `store_refs` (name, slug, seller) | commerce | catalog | `catalog.store.upserted` | seller ownership checks, store names on orders |
| `user_refs` (roles) | commerce | identity | `identity.user.*` | admin dashboard user counts |
| `products.stock` | catalog | commerce | `commerce.inventory.changed` | stock shown on product pages |
| `products.soldCount`, `purchases` | catalog | commerce | `commerce.order.completed` | sales shown and ranked; the review gate |
| `users` (display name) | catalog | identity | `identity.user.*` | reviewer names |
| search documents | Elasticsearch | catalog | `catalog.product.*`, `catalog.store.upserted`, reindex | ranking search results |

Replicas are eventually consistent: a change reaches consumers once the producer's relay publishes
it (polled every `outboxIntervalMs`, 500 ms by default) and the consumer applies it. Deliberate
consequences:

- Checkout charges `product_refs.price`; a price change applies to checkouts once replicated.
- Stock and sold counts shown by catalog can lag commerce briefly. Checkout always uses commerce's
  `inventory`, so the lag never oversells.
- A product created a moment ago may not be in commerce yet: setting its stock or adding it to a
  cart answers 409 `PRODUCT_SYNCING`, and the web app retries.
- Search results are ids only; catalog loads price and stock from its own data for each page.

## Ordering and duplicates

Events carry the producer's entity `version`. Every replica write applies only if the incoming
version is newer (`setWhere version < incoming` in Postgres, a version-guarded scripted upsert in
Elasticsearch). Counter-style effects (`order.completed` increments sold counts) record the event
id in an `inbox` in the same transaction and skip redeliveries. Product deletions are kept as
tombstones in search so a late, older upsert cannot resurrect them.

## Deleting data

Catalog deletes a product and publishes `catalog.product.deleted`. Commerce deletes its
`product_refs` row, cascading to `inventory` and `cart_items`; `order_items.product_id` becomes
null and the order keeps its name and price snapshot. Search marks the document deleted.
