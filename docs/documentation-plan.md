# SEAPEDIA Documentation Plan

## Purpose

This document outlines the comprehensive documentation structure for the SEAPEDIA project. The documentation serves two primary audiences:

1. **COMPFEST 18 SEA Judges** — Technical and non-technical assessors evaluating the project across 7 levels
2. **Public Codebase Readers** — Developers reviewing the architecture, business logic, and implementation

## Deployment Context

| Component | URL | Hosting |
|-----------|-----|---------|
| Frontend | `seapedia.sayyidrafee.com` | Vercel (Hobby plan, static build) |
| Backend API | `api-seapedia.sayyidrafee.com` | Self-hosted VPS (Dokploy, GHCR image) |
| Database | Self-hosted PostgreSQL | Same VPS as backend |
| SSL | Let's Encrypt | Via Dokploy |
| Container Registry | GHCR | GitHub Actions → Dokploy webhook |

## Documentation Structure

```
docs/
├── README.md                 # Documentation index & project overview
├── documentation-plan.md     # This file — documentation planning
├── SETUP.md                  # Installation, environment, deployment
├── AUTH.md                   # Authentication & multi-role system
├── BUSINESS-RULES.md         # Core rules, financial calculations, constraints
├── ORDER-LIFECYCLE.md        # Order status flow & transitions
├── GUEST.md                  # Guest/public browsing experience
├── SELLER.md                 # Seller flow walkthrough
├── BUYER.md                  # Buyer flow walkthrough
├── DRIVER.md                 # Driver flow walkthrough
├── ADMIN.md                  # Admin flow walkthrough
├── DISCOUNTS.md              # Voucher & promo system
├── DELIVERY.md               # Delivery methods, SLA, driver assignment
├── OVERDUE.md                # Overdue handling & time simulation
├── SECURITY.md               # SQLi, XSS, RBAC, input validation
├── SEED-DATA.md              # Demo accounts, seed data reference
├── DEMO-GUIDE.md             # Step-by-step demo script for judges
├── API.md                    # API overview & endpoint reference
└── SCHEMA.md                 # Database schema reference
```

## Content Matrix

Each file maps to specific challenge levels and assessment components:

| File | Levels Covered | Assessment Components |
|------|---------------|----------------------|
| `SETUP.md` | All | Delivery (works on any machine) |
| `AUTH.md` | 1, 7 | Completeness, Security |
| `BUSINESS-RULES.md` | 1-7 | Business rules correctness |
| `ORDER-LIFECYCLE.md` | 3-6 | Business rules correctness |
| `GUEST.md` | 1 | Completeness |
| `SELLER.md` | 2, 4 | Completeness, Business rules |
| `BUYER.md` | 3, 4 | Completeness, Business rules |
| `DRIVER.md` | 5 | Completeness |
| `ADMIN.md` | 6, 7 | Completeness, Security |
| `DISCOUNTS.md` | 4 | Business rules correctness |
| `DELIVERY.md` | 5 | Business rules correctness |
| `OVERDUE.md` | 6 | Business rules correctness |
| `SECURITY.md` | 7 | Security correctness |
| `SEED-DATA.md` | All | Demo quality |
| `DEMO-GUIDE.md` | All | Demo flow quality |
| `API.md` | All | API documentation |
| `SCHEMA.md` | All | Code quality, API design |

## Writing Principles

1. **Self-contained** — Each file is readable independently without requiring context from other docs
2. **Dual audience** — Written for both technical judges (code references) and non-technical judges (business explanations)
3. **Mermaid diagrams** — GitHub-renderable flow diagrams for visual clarity
4. **Code references** — Include `file:line` paths for judges who want to verify implementation
5. **Indonesian domain terms** — Keep original Indonesian order statuses with English translations
6. **Consistent structure** — Each role doc follows: Overview → Features → Business Rules → Walkthrough → API Endpoints

## Key Implementation Details to Document

### Financial Calculation (from `orders-checkout.service.ts`)
```
deliveryFee = { instant: 30000, next_day: 15000, regular: 10000 }
discountedSubtotal = max(0, subtotal - discountAmount)
taxBase = discountedSubtotal + deliveryFee
ppn = round(taxBase * 0.12)
totalAmount = taxBase + ppn
```

### Delivery SLA (from `admin.constants.ts`)
```
instant: 2 hours
next_day: 24 hours
regular: 48 hours
```

### Driver Earnings (from `driver.service.ts`)
- Drivers earn **100% of the delivery fee**
- Earnings are calculated from `deliveryJobs.deliveryFee` on completed jobs

### Overdue Handling (from `admin.service.ts`)
- Uses `systemTimeOffset` table for simulated time
- Admin can advance time via dashboard button (max 240 hours / 10 days)
- Overdue detection compares `orders.createdAt` against effective now minus SLA hours
- Processing: status → `dikembalikan`, wallet refund, stock restore, history entry
- Uses database transactions with `FOR UPDATE` lock to prevent race conditions

### Single-Store Checkout (from `buyers-cart.service.ts`)
- Cart is scoped to a single store (`carts.storeId`)
- Adding a product from a different store triggers a conflict response
- Buyer must clear cart before switching stores

### Discount Rules (from `discounts.service.ts`)
- Voucher and Promo cannot be combined
- System applies the higher-value discount
- Validation checks: expiry, remaining usage, minimum order amount
- Discount is applied before PPN calculation

## i18n Status

- Indonesian (`id.json`) is the default locale
- English (`en.json`) is available as alternate
- Some UI terms remain in English for readability (2-4 word terms)
- Both locale files contain 654 translation keys each

## Seed Data Status

- **Current implementation**: 5 demo accounts (admin, seller1, buyer1, driver1, multirole)
- **Planned implementation** (SEED-PLAN.md): 18 users, 65 products, 100 orders, 75 delivery jobs
- The SEED-PLAN.md is the target; the current seed.ts needs to be expanded
- After seeding, all discount codes must be usable
- Wallet top-up is available via single button/endpoint

## Image Strategy

- Product images, store logos, and avatars use Cloudflare R2 presigned URLs
- Seeded data uses realistic object key patterns (e.g., `products/{slug}.jpg`) without actual files
- R2 presign functionality is implemented and working (`StorageService` in `packages/platform/src/storage.ts`)
- Frontend `ImageUploader` component handles upload flow with preview
