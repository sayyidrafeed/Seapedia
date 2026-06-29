## Description

Implements Level 3 — **Cart Management** for SEAPEDIA buyers. Buyers can now add products to a cart, update quantities, remove items, and clear the cart — all while enforcing the **single-store checkout rule** required by the marketplace.

### Key Features

- **Backend cart service** with full CRUD: add, update quantity, remove item, clear cart, get summary
- **Single-store checkout enforcement**: adding a product from a different store returns a 409 Conflict error
- **Stock validation** before adding/updating cart items
- **Frontend cart page** at `/dashboard/buyer/cart` with quantity controls (increment/decrement), remove, clear, and subtotal display
- **Add to Cart button** on product detail pages with single-store conflict dialog
- **Cart badge** in navbar showing live item count (buyer role only)
- **Cart summary card** on buyer dashboard
- **Service layer unit tests** covering core cart operations

## Related Issue

Completes the **Implement Cart Management** subsection of Level 3 (PLAN.md).

## Type of Change

- [x] New feature (non-breaking change that adds functionality)
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] Breaking change (fix or feature that changes existing behavior)
- [x] Refactor (no functional changes, only code improvements)
- [ ] Performance improvement
- [x] Documentation update
- [ ] Chore (tooling, dependencies, CI/CD)
- [ ] Security fix

## Level Checklist

- [ ] Level 1 — Welcome to SEAPEDIA
- [ ] Level 2 — Building the Seller Experience
- [x] Level 3 — Buyer Wallet, Cart, and Checkout
- [ ] Level 4 — Discounts and Seller Order Processing
- [ ] Level 5 — Delivery and Driver Workflow
- [ ] Level 6 — Admin Monitoring and Overdue Handling
- [ ] Level 7 — Security Hardening and Finalization

## PR Highlights (Design Decisions)

1. **Lazy cart creation** — carts are auto-created on first add-to-cart, no separate create step.
2. **Upsert semantics** — adding a product already in the cart increments quantity instead of creating a duplicate.
3. **Cart store reset** — when the last item is removed or cart is cleared, the `storeId` resets to null, unlocking cross-store shopping again.
4. **Per-route middleware** — migrated existing wallet/address routes from global to per-route middleware for consistency with cart routes and proper OpenAPI security schema output.
5. **OpenAPI cache removed** — `/openapi.json` now regenerates on every request, keeping the frontend SDK generation in sync without server restarts.

## How Has This Been Tested?

- [x] Backend type check (`bun run check`)
- [x] Frontend type check (`bun run check`)
- [x] Backend lint & format (`bun run fl`)
- [x] Frontend lint & format (`bun run fl`)
- [x] Backend tests (`bun test`)
- [x] Manual testing (describe steps below)

**Test steps:**

1. Run `docker compose up -d` to start PostgreSQL, then `rtk bun run db:migrate && rtk bun run db:seed`
2. Start backend `rtk bun run dev` and frontend `rtk bun run dev` (from frontend directory)
3. Log in as a buyer, navigate to any product page and click **Add to Cart**
4. Verify cart badge updates in the navbar
5. Open cart page at `/dashboard/buyer/cart`, adjust quantities, remove items, clear cart
6. Try adding a product from a different store — verify the conflict dialog appears
7. Run `rtk bun test` — verify cart service tests pass

## API Changes

### New Endpoints

- `GET /api/buyers/cart` — Get buyer cart summary (items, subtotal, store info)
- `POST /api/buyers/cart/items` — Add item to cart (enforces single-store rule)
- `PUT /api/buyers/cart/items/:id` — Update cart item quantity
- `DELETE /api/buyers/cart/items/:id` — Remove item from cart
- `DELETE /api/buyers/cart` — Clear entire cart

### Modified Endpoints

- `GET/POST/PUT/DELETE /api/buyers/wallet/*` — Added `security: [{ cookieAuth: [] }]` OpenAPI metadata; moved auth middleware from global to per-route
- `GET/POST/PUT/DELETE /api/buyers/addresses/*` — Same security and middleware changes

## Checklist

- [x] My code follows the project's coding conventions and style
- [x] I have performed a self-review of my own code
- [x] I have commented complex code where necessary
- [x] I have updated the documentation (README, API docs, etc.) if needed
- [x] No new warnings or errors are introduced
- [x] Environment variables are documented if added
- [x] Security considerations have been addressed (input validation, XSS, SQLi, RBAC)

## Considerations / Open Questions for Reviewer

1. **Cart item uniqueness**: The schema enforces a unique constraint on `(cartId, productId)`. The service upserts (increments quantity if exists, inserts if not). Is the increment behavior preferred, or should it always insert a new line item? Current approach matches common e-commerce UX.

2. **Stock validation on add**: Currently validates `product.stock < quantity` at add time. Should we also validate stock at cart summary read time (to warn about items that are now out of stock)?

3. **Conflict dialog UX**: The current implementation shows a dialog with "Clear Cart & Add" or "Cancel". Would a "Replace item" flow (remove old store items, add new ones automatically) be preferred over requiring a manual clear?
