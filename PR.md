## Description

This PR implements **Level 3 — Buyer Wallet and Address Management** (5 pts) for SEAPEDIA. Buyers can now manage their wallet balance, simulate top-ups, view transaction history, and maintain delivery addresses — all gated behind the active Buyer role.

## Related Issue

Closes requirement: **Build Buyer Wallet and Address Management** (Level 3, first subsection)

## Type of Change

- [x] New feature (non-breaking change that adds functionality)
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] Breaking change (fix or feature that changes existing behavior)
- [ ] Refactor (no functional changes, only code improvements)
- [ ] Performance improvement
- [ ] Chore (tooling, dependencies, CI/CD)
- [ ] Documentation update
- [ ] Security fix

## Level Checklist

- [ ] Level 1 — Welcome to SEAPEDIA
- [ ] Level 2 — Building the Seller Experience
- [x] Level 3 — Buyer Wallet, Cart, and Checkout
- [ ] Level 4 — Discounts and Seller Order Processing
- [ ] Level 5 — Delivery and Driver Workflow
- [ ] Level 6 — Admin Monitoring and Overdue Handling
- [ ] Level 7 — Security Hardening and Finalization

## How Has This Been Tested?

- [x] Backend type check (`bun run check`)
- [x] Frontend type check (`bun run check`)
- [x] Backend lint & format (`bun run fl`)
- [x] Frontend lint & format (`bun run fl`)
- [x] Backend tests pass (`bun test` — 67 tests, 0 fail)
- [x] Manual testing (describe steps below)

**Test steps:**

1. **Register as buyer**: Create account with non-admin roles including `buyer`, select Buyer as active role
2. **View wallet**: Navigate to /dashboard/buyer → see balance card (defaults to Rp 0), default address card (shows if address exists or CTA)
3. **Request top-up**: Go to Wallet & Top-up → select preset amount or custom → choose payment channel → click "Request Top-Up"
4. **Simulate payment**: See Virtual Account screen → click "Simulate Payment Success" → balance updates immediately
5. **Check transaction history**: Transaction table below shows pending/success entries with type, method, reference, and formatted amounts
6. **Add address**: Go to Manage Addresses → click "Tambah Alamat" → fill form with label, recipient, phone, province, city, district, postal code, full address → Save
7. **Edit/Delete/Set default**: Use card action buttons (Ubah/Hapus/Jadikan Utama)
8. **Role guard**: Switch to non-buyer role → /dashboard/buyer redirects to /select-role

## API Changes

### New Endpoints

#### Buyer Wallet (`/api/buyers/wallet/*`)
- `GET /api/buyers/wallet` — Get buyer wallet balance
- `POST /api/buyers/wallet/topup/request` — Initiate a simulated top-up request
- `POST /api/buyers/wallet/topup/{transactionId}/simulate` — Simulate successful payment
- `GET /api/buyers/wallet/transactions` — Get wallet transaction history

#### Buyer Addresses (`/api/buyers/addresses/*`)
- `GET /api/buyers/addresses` — List delivery addresses
- `POST /api/buyers/addresses` — Add a new delivery address
- `PUT /api/buyers/addresses/{id}` — Update delivery address
- `PUT /api/buyers/addresses/{id}/default` — Set address as default
- `DELETE /api/buyers/addresses/{id}` — Delete a delivery address

All endpoints are protected by `requireSession` + `requireRole('buyer')`.

## Database Changes

### New Tables (via Drizzle ORM)

- **`wallets`** — One wallet per user (unique user_id), balance stored as integer (IDR), with timestamps
- **`wallet_transactions`** — Transaction log with amount, type (topup/payment/refund), payment_method, status (pending/success/failed), and reference number
- **`addresses`** — Full shipping address with label, recipient name, phone, province, city, district, postal code, full address, and is_default boolean

> Migration file `0005_fuzzy_gabe_jones.sql` contains all three table definitions. The drizzle/ directory was unignored from .gitignore to ensure migrations are version-controlled.

## Commit History

```
12 commits — logical atomic split across backend and frontend layers:

chore:        allow drizzle migration files to be tracked in version control
chore(backend): add drizzle SQL migration files for database schema
feat(backend):  add buyer wallet and address database schema
feat(backend):  implement buyer wallet and address service with tests
feat(backend):  add buyer wallet and address API endpoints with Zod validation
feat(backend):  register buyers module under /api/buyers
feat(frontend): regenerate API client SDK for buyer wallet and address endpoints
feat(frontend): add buyer dashboard layout with wallet and address navigation
feat(frontend): add buyer dashboard index with wallet balance and address cards
feat(frontend): implement wallet top-up page with simulated payment flow
feat(frontend): implement delivery address management page with full CRUD
chore(frontend): update route tree for buyer dashboard child pages
```

## Additional Context

### Design Decisions

- **Wallet auto-creation**: `getOrCreateWallet` lazily creates a wallet with 0 balance on first access — no separate registration step needed
- **Top-up simulation**: The flow generates a virtual account reference (prefixed `880`), stores a `pending` transaction, then `simulateTopUpPayment` atomically credits the wallet in a DB transaction. This mirrors real payment gateways without external integration
- **Address default logic**: First address is auto-default. Setting a different default unsets others. Deleting the default promotes the next address. All within DB transactions
- **Role guard**: All endpoints use `buyersRouter.use('*', requireSession, requireRole('buyer'))` — consistent with existing middleware patterns

### Requirements Covered (PLAN.md)

- ✅ Buyer wallet/balance resource
- ✅ Dummy top-up flow with transaction history
- ✅ Wallet transaction history display
- ✅ Delivery address management (CRUD + default)
- ✅ Buyer balance and top-up history in dashboard
- ✅ Only active Buyer role may access these features

### Next Steps (Level 3 remaining)

Cart management, checkout flow, and order creation are still needed to complete Level 3.

## PLANNED FOR NEXT

- Cart system with single-store checkout enforcement
- Checkout flow with delivery method selection, PPN 12%, fee calculation
- Order creation with stock reduction and status history
- Buyer order history and detail views
- Seller incoming order list
