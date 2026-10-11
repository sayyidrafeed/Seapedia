# Seed Data & Demo Accounts

SEAPEDIA provides demo accounts and seed data for testing all marketplace flows.

## Quick Login Credentials

### Current Seed (5 Accounts)

| Role | Email | Password | Name |
|------|-------|----------|------|
| Admin | `admin@seapedia.com` | `admin123` | System Administrator |
| Seller | `seller1@seapedia.com` | `seller123` | John Seller |
| Buyer | `buyer1@seapedia.com` | `buyer123` | Jane Buyer |
| Driver | `driver1@seapedia.com` | `driver123` | Bob Driver |
| Multi-role | `multirole@seapedia.com` | `multi123` | Alice Multirole |

### Planned Seed (18 Accounts)

| Role | Email | Password | Name |
|------|-------|----------|------|
| Admin | `admin@gmail.com` | `password123` | Raka Pratama |
| Seller | `budi@gmail.com` | `password123` | Budi Santoso |
| Seller | `aisyah@gmail.com` | `password123` | Aisyah Rahman |
| Seller | `dimas@gmail.com` | `password123` | Dimas Ramadhan |
| Seller | `maya@gmail.com` | `password123` | Maya Kusuma |
| Seller | `fajar@gmail.com` | `password123` | Fajar Nugroho |
| Buyer | `dewi@gmail.com` | `password123` | Dewi Lestari |
| Buyer | `sari@gmail.com` | `password123` | Sari Dewi |
| Buyer | `putri@gmail.com` | `password123` | Putri Anggraini |
| Buyer | `andi@gmail.com` | `password123` | Andi Prasetyo |
| Buyer | `rizki@gmail.com` | `password123` | Rizki Pratama |
| Buyer | `nadia@gmail.com` | `password123` | Nadia Saputri |
| Buyer | `agus@gmail.com` | `password123` | Agus Setiawan |
| Buyer | `rina@gmail.com` | `password123` | Rina Wulandari |
| Driver | `joko@gmail.com` | `password123` | Joko Widodo |
| Driver | `budi.h@gmail.com` | `password123` | Budi Hartono |
| Driver | `agus.w@gmail.com` | `password123` | Agus Wijaya |
| Multi-role | `rina.m@gmail.com` | `password123` | Rina Multirole |

## Seed Data Overview

### Stores (6)

| Store | Seller | Description |
|-------|--------|-------------|
| Toko Elektronik Budi | budi_santoso | Gadget & electronics |
| Fashion Corner ID | aisyah_rahman | Fashion for men & women |
| Gadget Hub Store | dimas_el | One-stop gadget shop |
| Maya Beauty Official | maya_kusuma | Beauty products |
| Rumah Tangga Shop | fajar_nugroho | Home & living |
| Rina's Multi Store | rina_multi | Daily necessities |

### Products (65)

- ~10-12 products per store
- Realistic Indonesian e-commerce products
- Prices in IDR (integer)
- Stock and sold counts vary

### Wallets

- All non-admin users have wallets
- Balances range from Rp 520,000 to Rp 3,150,000
- Transaction history includes top-ups, payments, and refunds

### Addresses

- 2-3 addresses per buyer
- Real Indonesian locations (Jakarta, Bandung, Surabaya, etc.)
- Each has a default address

### Discounts

**Vouchers (8)**:

| Code | Amount | Min Order |
|------|--------|-----------|
| `HEMAT10K` | Rp 10,000 | Rp 50,000 |
| `HEMAT25K` | Rp 25,000 | Rp 100,000 |
| `HEMAT50K` | Rp 50,000 | Rp 200,000 |
| `GRATIS100K` | Rp 100,000 | Rp 500,000 |
| `NEWUSER15K` | Rp 15,000 | Rp 75,000 |
| `FLASH20K` | Rp 20,000 | Rp 150,000 |
| `WEEKEND30K` | Rp 30,000 | Rp 250,000 |
| `BONUS5K` | Rp 5,000 | Rp 25,000 |

**Promos (4)**:

| Code | Percent | Max Discount | Min Order |
|------|---------|-------------|-----------|
| `PROMO10` | 10% | Rp 50,000 | Rp 100,000 |
| `PROMO20` | 20% | Rp 75,000 | Rp 200,000 |
| `MEGA25` | 25% | Rp 100,000 | Rp 300,000 |
| `SALE15` | 15% | Rp 40,000 | Rp 75,000 |

### Orders (100)

| Status | Count |
|--------|-------|
| `pesanan_selesai` | 55 |
| `sedang_dikirim` | 12 |
| `menunggu_pengirim` | 8 |
| `sedang_dikemas` | 15 |
| `dikembalikan` | 10 |

### Delivery Jobs (75)

| Status | Count |
|--------|-------|
| `completed` | 55 |
| `taken` | 12 |
| `pending` | 8 |

## Running Seed Data

```bash
cd backend
bun run db:seed
```

This creates the 5 demo accounts. For the full 18-user seed, run the expanded seed script (see SEED-PLAN.md).

## Image Strategy

- Seeded data uses realistic object key patterns (e.g., `products/{slug}.jpg`)
- No actual images are uploaded during seeding
- R2 presign functionality is implemented and working
- For a fully working demo with images, upload placeholder images to R2 manually

## Code References

| Component | File |
|-----------|------|
| Current seed script | `infra/seed/src/seed.ts` (wipes and seeds the identity, catalog and commerce databases, then rebuilds the search index) |
| Expanded seed plan | `SEED-PLAN.md` |
