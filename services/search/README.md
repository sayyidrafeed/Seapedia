# search

Owns the Elasticsearch index of products (alias `products`). It has no database and is not
routed by the gateway; only catalog calls it.

- `GET /search/products?q&storeSlug&page&limit` returns `{ ids, total }`. Ranking is text relevance
  (typo-tolerant on product and store names, exact on descriptions, every word required) plus a
  small boost for sold count and rating.
- `POST /search/reindex` builds a new index from catalog's export and swaps the alias atomically.
  It also runs on first boot when the alias does not exist. `bun src/reindex.cli.ts` calls it.

Sync: consumes catalog's `product` and `store` events, re-reads current documents from catalog,
and writes them in bulk. Sync batches and reindexes never interleave (`src/sync/lock.ts`). Run one
replica: the outbox consumer assumes a single reader.

The index holds no price or stock. Catalog loads those from its own database for every result.
Env: see `.env.example`.
