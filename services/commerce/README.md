# commerce

Owns money and fulfilment: wallets, addresses, carts, orders, discounts, delivery jobs, the admin
dashboard, and product stock. Database: `commerce`.

Stock lives here (`inventory`) so checkout reserves stock, debits the wallet, applies the voucher,
and creates the order in one local transaction. `product_refs` and `store_refs` are replicas of
catalog data, fed by catalog's outbox, so carts and order history work while catalog is down. If a
product is not replicated yet, `CatalogRefs.ensureProduct` reads it from catalog once.

| Public (`/api`) | Internal (`/internal`) |
| --- | --- |
| `buyers/*` wallet, addresses, cart | `GET inventory?productIds=` |
| `orders/*`, `seller/orders/*` | `GET sales?productIds=` units sold in completed orders |
| `seller/inventory/:productId` set stock | `GET purchases/check` review gate for catalog |
| `discounts/validate`, `driver/*`, `admin/*`, `locations/*` | `GET/POST outbox/:consumer` |

Events published (outbox): `inventory` (checkout, restock, overdue return) and `sales` (order
completed), consumed by catalog. Events consumed: catalog's `product` and `store`.

Calls: identity and catalog `stats` for the admin dashboard (503 if either is down).
Env: see `.env.example`.
