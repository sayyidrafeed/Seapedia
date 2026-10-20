# catalog

Owns stores, products, product reviews, and app reviews. Database: `catalog`.

Two columns are read models of commerce data: `products.stock` (from the `inventory` event) and
`products.soldCount` (from the `sales` event). Catalog never decides stock.

| Public (`/api`)                                                                         | Internal (`/internal`)                                                  |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `products` listing, detail, image upload; `products/:id/reviews`, `products/reviews/me` | `GET products?ids=` fields commerce replicates                          |
| `seller/products` CRUD for the seller's store                                           | `GET stores?ids=`                                                       |
| `stores` create, update, public profile                                                 | `GET search/documents`, `GET search/documents/export` search projection |
| `reviews` app reviews                                                                   | `GET stats`, `GET/POST outbox/:consumer`                                |

Product search sends free-text queries to the search service and loads the ranked ids from its own
database. If search is unset or fails within `SEARCH_TIMEOUT_MS`, the same query runs as ILIKE.

Events published (outbox): `product`, `store`, consumed by search and commerce.
Events consumed: commerce's `inventory` and `sales`.

Calls: commerce `GET /internal/purchases/check` (review gate), identity `GET /internal/users`
(reviewer name snapshot). Env: see `.env.example`.
