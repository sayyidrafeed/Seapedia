# API Reference

SEAPEDIA's public API is served by the API gateway, which routes each `/api` prefix to the service that owns it (identity, catalog, or commerce). The gateway merges the services' OpenAPI documents into one contract, shown in Scalar. Services validate every request with Zod. Internal service-to-service routes (`/internal/*`) are not reachable through the gateway; see [architecture/communication.md](./architecture/communication.md).

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Local | `http://localhost:3001` |
| Production | `https://api-seapedia.sayyidrafee.com` |

## Interactive Documentation

| Format | URL |
|--------|-----|
| Scalar UI | `/docs` |
| OpenAPI JSON | `/openapi.json` |

## Authentication

All protected endpoints require the `__session` cookie (HttpOnly JWT).
1. The gateway asks identity to verify the JWT signature, expiry, and that the session still exists in `active_session`.
2. The owning service checks that the active role matches the endpoint.

## Endpoint Overview

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register new account |
| POST | `/login` | No | Login |
| POST | `/logout` | Yes | Logout (invalidates session) |
| GET | `/session` | Yes | Get current session info |
| POST | `/select-role` | Yes | Switch active role |
| POST | `/onboard` | Yes | Complete onboarding |
| GET | `/financial-summary` | Yes | Financial summary across roles |

### Products (`/api/products`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | List products (catalog) |
| GET | `/:slug` | No | Product detail with store info |
| POST | `/image/presign` | Seller | Get presigned URL for image |

### Seller Products (`/api/seller/products`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Seller | Create product |
| PUT | `/:productId` | Seller | Update product |
| DELETE | `/:productId` | Seller | Delete product |

Product create and update do not take `stock`; the `stock` in responses is catalog's copy of
commerce's inventory.

### Seller Inventory (`/api/seller/inventory`, commerce)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/:productId` | Seller | Set stock of a product in the seller's store |

### Stores (`/api/stores`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | List all stores |
| GET | `/:slug` | No | Store detail |
| PUT | `/` | Seller | Update store profile |
| POST | `/:storeId/logo/presign` | Seller | Presign for logo upload |

### Reviews (`/api/reviews`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | List application reviews |
| POST | `/` | No | Submit application review |

### Product Reviews (`/api/products`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:productId/reviews` | No | List product reviews |
| POST | `/:productId/reviews` | Buyer | Submit product review |

### Buyers (`/api/buyers`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/wallet` | Buyer | Get wallet balance |
| POST | `/wallet/topup` | Buyer | Top up wallet |
| GET | `/wallet/transactions` | Buyer | Wallet transaction history |
| GET | `/addresses` | Buyer | List addresses |
| POST | `/addresses` | Buyer | Create address |
| PUT | `/addresses/:id` | Buyer | Update address |
| DELETE | `/addresses/:id` | Buyer | Delete address |
| GET | `/cart` | Buyer | Get cart summary |
| POST | `/cart/items` | Buyer | Add item to cart |
| PUT | `/cart/items/:productId` | Buyer | Update item quantity |
| DELETE | `/cart/items/:productId` | Buyer | Remove item from cart |
| DELETE | `/cart` | Buyer | Clear cart |
| POST | `/checkout/preview` | Buyer | Preview checkout |
| POST | `/checkout` | Buyer | Create order |

### Orders (`/api/orders`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Buyer | Order history |
| GET | `/:orderId` | Buyer | Order detail |
| GET | `/report` | Buyer | Spending report |

### Seller Orders (`/api/seller/orders`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Seller | Incoming orders |
| GET | `/:orderId` | Seller | Order detail |
| POST | `/:orderId/process` | Seller | Process order |
| GET | `/report` | Seller | Income report |

### Discounts (`/api/discounts`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | List available discounts |
| POST | `/validate` | Buyer | Validate discount code |

### Admin Discounts (`/api/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/vouchers` | Admin | List all vouchers |
| POST | `/vouchers` | Admin | Create voucher |
| GET | `/vouchers/:id` | Admin | Voucher detail |
| GET | `/promos` | Admin | List all promos |
| POST | `/promos` | Admin | Create promo |
| GET | `/promos/:id` | Admin | Promo detail |

### Driver (`/api/driver`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/jobs/available` | Driver | List available jobs |
| GET | `/jobs/:jobId` | Driver | Job detail |
| POST | `/jobs/:jobId/take` | Driver | Take a job |
| POST | `/jobs/:jobId/complete` | Driver | Complete a job |
| GET | `/stats` | Driver | Driver stats and earnings |
| GET | `/history` | Driver | Job history (paginated) |

### Admin (`/api/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/summary` | Admin | Dashboard statistics |
| POST | `/time/simulate` | Admin | Advance simulated time |
| POST | `/overdue/process` | Admin | Process overdue orders |

### Users (`/api/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | Yes | Get current user profile |
| PUT | `/me` | Yes | Update profile |
| POST | `/me/avatar/presign` | Yes | Presign for avatar upload |

### Locations (`/api/locations`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/provinces` | No | List provinces |
| GET | `/cities` | No | List cities by province |
| GET | `/districts` | No | List districts by city |

### Health (`/api/health`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Health check |

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "details": [...]
}
```

### Error Codes

| Status | Description |
|--------|-------------|
| 400 | Validation error (Zod) |
| 401 | Unauthorized (no session) |
| 403 | Forbidden (wrong role) |
| 404 | Resource not found |
| 409 | Conflict (state conflict) |
| 500 | Internal server error |

## Request/Response Format

- Content-Type: `application/json`
- Authentication: Cookie-based (`__session`)
- Currency: IDR (integer, no decimals)
- Timestamps: ISO 8601 format
- IDs: UUID v4

## OpenAPI Specification

The full OpenAPI 3.0.0 specification is available at:

```
https://api-seapedia.sayyidrafee.com/openapi.json
```

This spec is used by:
- Scalar for interactive documentation
- hey-api for frontend SDK generation
- Any OpenAPI-compatible tools
