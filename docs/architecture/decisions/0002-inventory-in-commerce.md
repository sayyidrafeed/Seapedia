# 0002: Commerce owns stock

Status: accepted (2026-10)

## Context

Checkout must check and decrement stock, debit the wallet, consume a voucher, and create the order
atomically. If stock lived in catalog, checkout would span two databases and need a saga:
reservations, timeouts, compensation when payment fails after stock was taken.

## Decision

Stock (`inventory`) lives in commerce. Checkout stays one local transaction. Catalog keeps a
display copy of stock (`products.stock`), updated from commerce's `inventory` events. Sellers set
stock with `PUT /api/seller/inventory/{productId}` on commerce; product details stay on catalog.

## Consequences

- No distributed transaction and no compensation logic.
- The seller product form makes two calls (catalog for details, commerce for stock).
- Stock shown on product pages can lag by a few seconds. Checkout never reads that copy.
