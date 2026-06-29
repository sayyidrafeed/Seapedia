# SEAPEDIA Backend

Hono REST API running on Bun with TypeScript, Zod validation, Drizzle ORM with PostgreSQL, custom JWT authentication, and Scalar API documentation.

## Tech Stack

| Library                      | Purpose                                         |
| ---------------------------- | ----------------------------------------------- |
| Hono                         | Web framework (ultrafast, Bun-native)           |
| TypeScript                   | Strict mode, ES2022 target                      |
| Zod                          | Runtime schema validation with OpenAPI metadata |
| `@hono/zod-openapi`          | OpenAPI spec generation from Hono routes        |
| `hono-openapi`               | OpenAPI route metadata helpers                  |
| `@scalar/hono-api-reference` | Interactive API reference UI at `/docs`         |
| Drizzle ORM                  | Type-safe ORM for PostgreSQL                    |
| PostgreSQL                   | Relational database                             |
| `jose`                       | JWT signing and verification (HS256)            |
| Bun                          | Package manager and runtime                     |

## Prerequisites

- [Bun](https://bun.sh) >= 1.2
- PostgreSQL >= 16 (local or remote)

## Getting Started

```bash
cd backend
cp .env.example .env
bun install
bun run db:migrate
bun run db:seed    # Creates demo accounts (optional)
bun run dev
```

The API starts on [http://localhost:3001](http://localhost:3001).

API documentation is available at [http://localhost:3001/docs](http://localhost:3001/docs).

### Database Setup

```bash
bun run db:generate    # Create Drizzle migration
bun run db:migrate     # Apply migration to PostgreSQL
bun run db:seed        # Seed demo accounts (admin, buyer, seller, driver)
bun run db:studio      # (Optional) Open Drizzle Studio
```

## Environment Variables

| Variable       | Required | Description                                            |
| -------------- | -------- | ------------------------------------------------------ |
| `DATABASE_URL` | Yes      | PostgreSQL connection string                           |
| `JWT_SECRET`   | Yes      | Secret key for signing JWTs (min 8 chars)              |
| `NODE_ENV`     | No       | `development`, `production`, or `test`                 |
| `PORT`         | No       | Server port (default: 3001)                            |
| `FRONTEND_URL` | No       | Allowed CORS origin (default: `http://localhost:5173`) |

## Available Scripts

| Command               | Description                                 |
| --------------------- | ------------------------------------------- |
| `bun run dev`         | Start dev server with hot reload on `:3001` |
| `bun run deploy`      | Deploy via Docker                           |
| `bun run check`       | TypeScript type check (`tsc --noEmit`)      |
| `bun run lint`        | Run oxlint                                  |
| `bun run format`      | Run oxfmt                                   |
| `bun run fl`          | Format then lint                            |
| `bun test`            | Run Bun tests                               |
| `bun run db:generate` | Create Drizzle migration                    |
| `bun run db:migrate`  | Apply Drizzle migration                     |
| `bun run db:seed`     | Seed demo accounts and data                 |
| `bun run db:studio`   | Open Drizzle Studio                         |

## Project Structure

```
src/
├── index.ts              # Bun.serve entrypoint
├── app.ts                # App composition (middleware, CORS, route mounting, docs)
├── env.ts                # Environment type definitions and validation
├── db/
│   ├── index.ts          # Drizzle + PostgreSQL client
│   ├── seed.ts           # Demo data seeder
│   └── schema/
│       ├── auth-schema.ts # Users, roles, sessions
│       ├── products-schema.ts
│       ├── reviews-schema.ts
│       └── index.ts      # Re-exports all tables
├── lib/
│   ├── errors.ts         # Domain error hierarchy (NotFound, Validation, Forbidden, Conflict)
│   ├── factory.ts        # Typed Hono factory
│   ├── jwt.ts            # JWT sign/verify (HS256, 2h expiry)
│   ├── openapi.ts        # OpenAPI response helpers
│   └── schemas.ts        # Shared Zod schemas
├── middleware/
│   ├── auth.ts           # requireSession (JWT verification) and requireRole
│   └── types.ts          # Middleware type declarations
└── modules/
    ├── health/           # GET /api/health
    ├── auth/             # Registration, login, logout, session, role selection
    ├── reviews/          # Public application reviews
    ├── stores/           # Seller store management
    ├── products/         # Product CRUD + public catalog
    ├── wallet/           # Buyer wallet and top-up
    ├── cart/             # Cart management with single-store checkout
    ├── orders/           # Checkout, order lifecycle, status history
    ├── discounts/        # Voucher and Promo resources
    ├── reports/          # Buyer spending, Seller income reports
    ├── delivery/         # Delivery jobs, Driver workflow
    ├── admin/            # Admin monitoring dashboard
    └── overdue/          # Overdue detection and auto refund/return
```

## Architecture

### Modular Monolith

The backend follows a **vertical feature slice** pattern. Each feature in `src/modules/[name]/` is self-contained:

```
src/modules/products/
├── products.routes.ts    # Route definitions + OpenAPI metadata
├── products.handler.ts   # Request handlers (thin — delegates to service)
├── products.service.ts   # Business logic (no Hono Context)
└── products.index.ts     # Barrel file for cross-module imports
```

- Services never receive Hono `Context` — they operate on plain data.
- Handlers use `c.req.valid()` for validated inputs.

### Request Lifecycle

```
Incoming Request
  → CORS Middleware
  → requireSession (optional per route — verifies JWT from __session cookie, sets userId/activeRole)
  → requireRole (optional per route — checks active role matches endpoint requirements)
  → Zod Validator (validates path/query/body)
  → Handler → Service → Response
```

### Error Handling

A global `onError` handler in `app.ts` maps domain errors to HTTP JSON responses:

| Error Class       | HTTP Status | Description                 |
| ----------------- | ----------- | --------------------------- |
| `NotFoundError`   | 404         | Resource not found          |
| `ValidationError` | 400         | Invalid input               |
| `ForbiddenError`  | 403         | Not authorized              |
| `ConflictError`   | 409         | Duplicate or state conflict |

All domain errors extend `DomainError` and produce structured responses matching the shared `errorSchema`.

### Authentication

- **Password hashing**: Bun's native `Bun.password.hash()` with bcrypt algorithm.
- **Session tokens**: JWTs signed with `jose` (HS256 algorithm, 2-hour expiration), stored in an HTTP-only cookie named `__session`.
- **`requireSession`**: Middleware that reads the `__session` cookie, verifies the JWT, validates the session exists in the `active_session` table, and sets `userId`, `sessionId`, and `activeRole` in Hono context variables.
- **`requireRole`**: Middleware that checks whether `activeRole` matches the expected role for the endpoint. Returns 403 if mismatched.
- **Role model**: Users can own multiple roles (admin, seller, buyer, driver) stored in the `user_role` join table. The `active_session` table tracks which role is active per session. Authorization is always based on the active role, not the full list of roles.
- **Admin role**: Created via seed data only. Admin cannot be assigned through the onboarding flow (which only offers buyer, seller, driver). Admin uses the same role-selection mechanism as non-admin roles.
- Authorization is enforced **server-side** — the frontend UI is never trusted for access control.

### OpenAPI & API Documentation

Every route defines OpenAPI metadata:

- Request schemas (body, query, params) use Zod with `@hono/zod-openapi` decorators.
- Response schemas are registered using `hono-openapi`'s `describeRoute`.
- The compiled OpenAPI JSON is served at `/openapi.json`.
- Interactive documentation is served at `/docs` via **Scalar**.

### Database

- **PostgreSQL** — relational database.
- **Drizzle ORM** with the `drizzle-orm/postgres-js` driver provides type-safe queries.
- Schema files in `src/db/schema/` define Drizzle table objects.
- Migrations are generated with Drizzle Kit and applied with `drizzle-kit migrate`.

## Demo Accounts (Seed Data)

Run `bun run db:seed` to create the following demo accounts:

| Username | Password      | Roles |
| -------- | ------------- | ----- |
| admin    | adminpassword | admin |

The admin user logs in and is auto-redirected to the admin dashboard (single role). Multi-role users can be created through registration + onboarding.

## Cloudflare-Specific Notes

This backend runs on Bun as a standard HTTP server. It is not deployed on Cloudflare Workers.
