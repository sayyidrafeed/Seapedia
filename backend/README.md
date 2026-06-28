# SEAPEDIA Backend

Hono REST API deployed on Cloudflare Workers, using TypeScript, Zod validation, Drizzle ORM with D1 (SQLite), Clerk authentication, and Scalar API documentation.

## Tech Stack

| Library                    | Purpose                                         |
| -------------------------- | ----------------------------------------------- |
| Hono                       | Web framework (ultrafast, Cloudflare-native)    |
| TypeScript                 | Strict mode, ES2022 target                      |
| Zod                        | Runtime schema validation with OpenAPI metadata |
| hono-openapi               | OpenAPI spec generation from Hono routes        |
| @scalar/hono-api-reference | Interactive API reference UI at `/docs`         |
| Drizzle ORM                | Type-safe ORM for SQLite (D1 driver)            |
| Cloudflare D1              | Edge-distributed SQLite database                |
| Clerk (`@clerk/hono`)      | JWT-based authentication middleware             |
| Bun                        | Package manager and runtime (dev)               |
| Wrangler                   | Cloudflare Workers CLI                          |
| Drizzle Kit                | Migration generation and management             |

## Prerequisites

- [Bun](https://bun.sh) >= 1.2
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) (`bun add -g wrangler`)
- [Cloudflare account](https://dash.cloudflare.com) (free plan works)

## Getting Started

```bash
cd backend
cp .env.example .env
bun install
bun run dev
```

The API starts on [http://localhost:8787](http://localhost:8787).

### Database Setup

```bash
bun run db:generate    # Create Drizzle migration
bun run db:apply       # Apply migration to D1 via wrangler
bun run db:studio      # (Optional) Open Drizzle Studio
```

## Environment Variables

| Variable                | Required      | Description                                          |
| ----------------------- | ------------- | ---------------------------------------------------- |
| `CLERK_SECRET_KEY`      | Yes           | Clerk API secret key                                 |
| `CLERK_PUBLISHABLE_KEY` | Yes           | Clerk publishable key                                |
| `DB`                    | Yes (binding) | D1 database binding (configured in `wrangler.jsonc`) |

## Available Scripts

| Command               | Description                             |
| --------------------- | --------------------------------------- |
| `bun run dev`         | Start wrangler dev server on `:8787`    |
| `bun run deploy`      | Deploy Worker to Cloudflare             |
| `bun run check`       | TypeScript type check (`tsgo --noEmit`) |
| `bun run lint`        | Run oxlint                              |
| `bun run format`      | Run oxfmt                               |
| `bun run fl`          | Format then lint                        |
| `bun test`            | Run Bun tests                           |
| `bun run db:generate` | Create Drizzle migration                |
| `bun run db:migrate`  | Apply Drizzle migration                 |
| `bun run db:apply`    | Apply migration to D1 via wrangler      |
| `bun run db:studio`   | Open Drizzle Studio                     |

## Project Structure

```
src/
├── index.ts              # Workers entrypoint (exports Hono app as fetch handler)
├── app.ts                # App composition (middleware, CORS, route mounting, docs)
├── env.ts                # Environment type definitions and validation
├── db/
│   ├── index.ts          # Drizzle client factory (createDb)
│   └── schema/
│       ├── auth-schema.ts # User table definition
│       └── index.ts      # Re-exports all tables
├── lib/
│   ├── errors.ts         # Domain error hierarchy (NotFound, Validation, Forbidden, Conflict)
│   ├── factory.ts        # Typed Hono factory (Bindings + Variables)
│   ├── openapi.ts        # OpenAPI response helpers (jsonContent, errorResponses)
│   └── schemas.ts        # Shared Zod schemas (pagination, error, success)
├── middleware/
│   ├── auth.ts           # requireSession (Clerk getAuth), requirePermission (stub)
│   └── types.ts          # Middleware type declarations
└── modules/
    ├── health/           # GET /api/health (example feature slice)
    ├── auth/             # Authentication and role endpoints
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
- The repository layer is optional and only added when query complexity justifies it.

### Request Lifecycle

```
Incoming Request
  → Clerk Middleware (global, verifies JWT)
  → requireSession (extracts userId, rejects unauthenticated)
  → requirePermission (checks active role against endpoint requirements)
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

- `clerkMiddleware()` is applied globally to all routes in `app.ts`.
- `requireSession` extracts `userId` via Clerk's `getAuth(c)` and stores it in Hono context variables.
- `requirePermission` checks that the user's active role matches the required role for the endpoint.
- Authorization is enforced **server-side** — the frontend UI is never trusted for access control.

### OpenAPI & API Documentation

Every route must define OpenAPI metadata:

- Request schemas (body, query, params) use Zod with `@hono/zod-openapi` decorators.
- Response schemas are registered using the `jsonContent()` helper.
- Operation IDs must be stable (used by the frontend SDK generator).
- The compiled OpenAPI JSON is served at `/openapi.json`.
- Interactive documentation is served at `/docs` via **Scalar**.

### Database

- **Cloudflare D1** — edge-distributed SQLite.
- **Drizzle ORM** with the `drizzle-orm/d1` driver provides type-safe queries.
- Schema files in `src/db/schema/` define Drizzle table objects.
- Migrations are generated with Drizzle Kit and applied via Wrangler.
- D1 binding name is `DB` (database name: `seapedia-db`).

## Cloudflare-Specific Notes

- Workers Free plan: 100K requests/day, 10ms CPU per invocation.
- D1 Free plan: 5M rows read/day, 100K writes/day, 5GB storage.
- D1 queries do not count toward Worker CPU time.
- Configuration is in `wrangler.jsonc` (not `wrangler.toml`).

For detailed code conventions and agent development rules, see [AGENTS.md](./AGENTS.md).
