# search

Owns the Elasticsearch index of products (alias `products`, plus `products_stores` for store
names). No database of its own and not routed by Kong.

- `GET /search/products?q&storeSlug&page&limit` (scope `search:query`) returns `{ ids, total }`:
  typo-tolerant on product and store names, exact on descriptions, every word required, with a
  small boost for sold count and rating (weights in Consul `config/search/*`).
- `POST /search/reindex` (scope `search:reindex`) rebuilds the index from catalog's export and
  swaps the alias atomically; it also runs on first boot.

Consumes `catalog.product.upserted`, `catalog.product.deleted`, `catalog.store.upserted`. Writes are
version-guarded scripted upserts, deletions are tombstones, and sync batches never interleave
with a reindex (`src/sync/lock.ts`). The index holds no price or stock.
