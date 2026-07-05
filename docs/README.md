# SEAPEDIA Documentation

> **Software Engineering Academy — COMPFEST 18**

Welcome to the SEAPEDIA documentation. SEAPEDIA is a multi-role e-commerce platform connecting Buyers, Sellers, Drivers, and Administrators in a single marketplace. This documentation covers the complete technical and business flow across all 7 challenge levels.

## Live Deployment

| Component | URL |
|-----------|-----|
| Frontend | [seapedia.sayyidrafee.com](https://seapedia.sayyidrafee.com) |
| Backend API | [api-seapedia.sayyidrafee.com](https://api-seapedia.sayyidrafee.com) |
| API Docs (Scalar) | [api-seapedia.sayyidrafee.com/docs](https://api-seapedia.sayyidrafee.com/docs) |

## Documentation Index

### Getting Started

| Document | Description |
|----------|-------------|
| [SETUP.md](./SETUP.md) | Installation, environment variables, local development, and deployment |
| [SEED-DATA.md](./SEED-DATA.md) | Demo accounts, test data, and seed data reference |
| [DEMO-GUIDE.md](./DEMO-GUIDE.md) | Step-by-step walkthrough script for judges |

### Architecture & Core Concepts

| Document | Description |
|----------|-------------|
| [AUTH.md](./AUTH.md) | Authentication system, JWT sessions, multi-role model, and role selection |
| [BUSINESS-RULES.md](./BUSINESS-RULES.md) | Core business rules, financial calculations, and constraints |
| [ORDER-LIFECYCLE.md](./ORDER-LIFECYCLE.md) | Order status flow, transitions, and status history |
| [SCHEMA.md](./SCHEMA.md) | Database schema reference with all tables and relationships |
| [API.md](./API.md) | API overview, endpoint reference, and request/response formats |

### Role-Based Flows

| Document | Description |
|----------|-------------|
| [GUEST.md](./GUEST.md) | Guest browsing, product catalog, public reviews |
| [SELLER.md](./SELLER.md) | Store management, product CRUD, order processing, income reports |
| [BUYER.md](./BUYER.md) | Wallet, addresses, cart, checkout, order history, spending reports |
| [DRIVER.md](./DRIVER.md) | Find jobs, take jobs, complete delivery, earnings |
| [ADMIN.md](./ADMIN.md) | Monitoring dashboard, discount management, time simulation, overdue handling |

### Feature Deep Dives

| Document | Description |
|----------|-------------|
| [DISCOUNTS.md](./DISCOUNTS.md) | Voucher and promo system, combination rules, validation |
| [DELIVERY.md](./DELIVERY.md) | Delivery methods, SLA rules, driver assignment |
| [OVERDUE.md](./OVERDUE.md) | Overdue detection, auto-refund, auto-return, time simulation |
| [SECURITY.md](./SECURITY.md) | SQL injection, XSS prevention, RBAC, input validation |

## Tech Stack

| Layer | Backend | Frontend |
|-------|---------|----------|
| Runtime | Bun | Bun (Vite) |
| Framework | Hono | React 19 |
| Database | PostgreSQL 17 | — |
| ORM | Drizzle ORM | — |
| Auth | JWT (HS256, HttpOnly cookie) | Cookie-based session |
| Validation | Zod | — |
| API Docs | Scalar (OpenAPI) | — |
| API Client | — | hey-api (generated SDK) |
| Routing | Hono routes | TanStack Router |
| Styling | — | Tailwind CSS v4 + shadcn/ui |
| Object Storage | Cloudflare R2 | — |
| i18n | — | i18next (EN/ID) |

## Project Structure

```
seapedia/
├── frontend/               # React SPA
│   └── src/
│       ├── routes/         # TanStack Router file routes
│       ├── features/       # Domain feature slices
│       ├── components/     # Shared + shadcn/ui components
│       ├── hooks/          # Custom React hooks
│       └── lib/
│           ├── api/        # hey-api generated SDK
│           ├── auth/       # Auth context + route guards
│           ├── query/      # TanStack Query client
│           └── i18n/       # i18next (EN/ID locales)
├── backend/                # Hono API on Bun
│   └── src/
│       ├── modules/        # Feature slices (14 modules)
│       ├── db/schema/      # Drizzle table definitions
│       ├── middleware/      # Auth middleware
│       └── lib/            # Shared utilities
├── docs/                   # This documentation
└── docker-compose.yml      # Full-stack Docker setup
```

## Challenge Levels

| Level | Feature | Points | Status |
|-------|---------|--------|--------|
| 1 | Public marketplace, auth & role awareness, public reviews | 20 | ✅ |
| 2 | Seller store & product management, public catalog | 15 | ✅ |
| 3 | Buyer wallet, cart, checkout, order history | 20 | ✅ |
| 4 | Voucher/promo discounts, seller order processing, reports | 15 | ✅ |
| 5 | Delivery workflow, driver dashboard & earnings | 10 | ✅ |
| 6 | Admin monitoring, discount management, overdue handling | 10 | ✅ |
| 7 | Security hardening (XSS, SQLi, RBAC, input validation) | 10 | ✅ |
| **Bonus** | UI quality + deployment | 25 | In Progress |

## Quick Reference

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gmail.com | password123 |
| Seller | budi@gmail.com | password123 |
| Buyer | dewi@gmail.com | password123 |
| Driver | joko@gmail.com | password123 |
| Multi-role | rina.m@gmail.com | password123 |

### Key URLs

| Service | Local | Production |
|---------|-------|------------|
| Frontend | localhost:5173 | seapedia.sayyidrafee.com |
| Backend API | localhost:3001 | api-seapedia.sayyidrafee.com |
| API Docs | localhost:3001/docs | api-seapedia.sayyidrafee.com/docs |
| OpenAPI JSON | localhost:3001/openapi.json | api-seapedia.sayyidrafee.com/openapi.json |
