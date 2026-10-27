# commerce

Owns money and fulfilment: wallets, addresses, carts, orders, discounts, delivery jobs, the admin
dashboard, and product stock. Store: Postgres (`commerce-db`).

Stock lives here (`inventory`), so checkout reserves stock, debits the wallet, applies the
voucher and creates the order in one local transaction. Replicas from events: `product_refs`,
`store_refs` (catalog) and `user_refs` (identity), so carts, order history and the admin dashboard
never call another service. A product not replicated yet answers 409 `PRODUCT_SYNCING`.

Public routes (via Kong): `/api/buyers`, `/api/orders`, `/api/seller/orders`,
`/api/seller/inventory/:productId`, `/api/discounts`, `/api/driver`, `/api/admin`,
`/api/locations`. No service-to-service routes.

Publishes: `commerce.inventory.changed` (checkout, restock, overdue return),
`commerce.order.completed` (delivery completed). Consumes: `catalog.product.*`,
`catalog.store.upserted`, `identity.user.*`. Config (Consul): `deliveryFees`.
