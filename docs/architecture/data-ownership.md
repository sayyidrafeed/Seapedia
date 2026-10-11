# Data ownership

Every table has exactly one owner. Other services never query it; they ask the owner, or keep a
replica that the owner's events keep current.

| Service | Tables |
| --- | --- |
| identity | `users`, `user_role`, `active_session` |
| catalog | `stores`, `products`, `product_reviews`, `app_review`, `outbox` |
| commerce | `wallets`, `wallet_transactions`, `addresses`, `carts`, `cart_items`, `orders`, `order_items`, `order_status_history`, `vouchers`, `promos`, `delivery_jobs`, `system_time_offset`, `inventory`, `product_refs`, `store_refs`, `outbox` |
| search | Elasticsearch alias `products` |

User ids appear in catalog (`stores.seller_id`, `product_reviews.buyer_id`) and commerce
(`orders.buyer_id`, `wallets.user_id`, ...) as plain UUIDs with no foreign key, because identity's
table lives in another database.

## Replicas and read models

| Copy | Lives in | Owner | Kept current by | Used for |
| --- | --- | --- | --- | --- |
| `product_refs` (name, slug, price, image, store) | commerce | catalog | `product` events | cart, checkout prices, order snapshots |
| `store_refs` (name, slug, seller) | commerce | catalog | `store` events | seller ownership checks, store names on orders |
| `products.stock` | catalog | commerce (`inventory`) | `inventory` events | showing stock on product pages |
| `products.sold_count` | catalog | commerce (completed orders) | `sales` events | showing sales, search ranking |
| `product_reviews.reviewer_name` | catalog | identity | snapshot when the review is written | review lists |
| search documents | Elasticsearch | catalog | `product` and `store` events, full reindex | ranking search results |

Replicas are eventually consistent. With the default 2 s poll interval, a change reaches its
consumers within a few seconds. The consequences are deliberate:

- Checkout charges `product_refs.price`. A price change applies to checkouts once replicated.
- The stock and sold counts catalog shows can lag commerce by a few seconds. Checkout always uses
  commerce's `inventory`, so the lag never oversells.
- Search results carry only ids. Catalog loads price and stock from its own tables, so a result is
  never shown with a stale price. A product deleted moments ago is dropped during that load.

## Deleting data

Catalog deletes a product, then publishes a `product` event. Commerce sees that catalog no longer
returns it and deletes its `product_refs` row, which cascades to `inventory` and `cart_items`;
`order_items.product_id` becomes null, and the order keeps its name and price snapshot. Search
removes the document. No code path deletes users or stores today.
