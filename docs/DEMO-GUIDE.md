# Demo Guide

This document provides a step-by-step walkthrough for demonstrating SEAPEDIA to judges. Each flow covers a complete business scenario.

## Prerequisites

1. Backend running at `api-seapedia.sayyidrafee.com`
2. Frontend running at `seapedia.sayyidrafee.com`
3. Database seeded with demo data

## Flow 1: Guest Browsing & Public Reviews

**Time: ~2 minutes**

1. Open `seapedia.sayyidrafee.com` (not logged in)
2. **Landing page**: Show hero section, search bar, featured products
3. **Browse products**: Click "Products" in navigation
4. **Product detail**: Click on a product → show name, price, store info, description
5. **Store info**: Show the store name and rating on the product page
6. **Public review**: Scroll to review section, submit a review:
   - Name: "Test Judge"
   - Rating: 5
   - Comment: "Great marketplace platform!"
7. **Verify**: Review appears in the review list
8. **Navigation**: Show that guest nav has no dashboard links, no cart

## Flow 2: Registration & Multi-Role Selection

**Time: ~2 minutes**

1. Click "Register"
2. Fill in: username, email, password
3. Complete registration → redirected to onboarding
4. **Onboarding**: Select roles (Buyer is mandatory, select Seller and Driver too)
5. Complete → redirected to role selection page
6. **Role selection**: Show all 3 roles available
7. Select "Buyer" → redirected to Buyer Dashboard
8. **Role switcher**: Click role switcher in navbar → switch to "Seller"
9. **Seller Dashboard**: Show empty store, no products yet
10. **Role switcher**: Switch to "Driver"
11. **Driver Dashboard**: Show empty job list

## Flow 3: Seller — Store & Product Setup

**Time: ~3 minutes**

1. Login as `seller1@seapedia.com` / `seller123`
2. **Store Profile**: Navigate to store settings
3. Show store name: "John Seller's Store"
4. **Add Product**: Click "Add Product"
5. Fill in: name, description, price (e.g., Rp 500,000), stock (e.g., 10)
6. Save → product appears in product list
7. **Verify**: Product appears in public catalog (open in incognito or check product listing)

## Flow 4: Buyer — Wallet, Cart, Checkout

**Time: ~3 minutes**

1. Login as `buyer1@seapedia.com` / `buyer123`
2. **Top Up Wallet**:
   - Navigate to Wallet
   - Enter amount: Rp 1,000,000
   - Click "Top Up" → balance increases
3. **Add Address**:
   - Navigate to Addresses
   - Add a delivery address
4. **Browse & Add to Cart**:
   - Go to product catalog
   - Click "Add to Cart" on a product
5. **Cart Review**:
   - Show cart items, subtotal
6. **Checkout**:
   - Select delivery method (e.g., Instant)
   - Apply discount code (e.g., `HEMAT25K`)
   - Show checkout summary:
     - Subtotal
     - Discount
     - Delivery fee
     - PPN 12%
     - Total
   - Confirm checkout
7. **Order Created**:
   - Navigate to Order History
   - Show order with status `sedang_dikemas`
   - Show order detail with full financial breakdown

## Flow 5: Seller — Order Processing

**Time: ~2 minutes**

1. Login as `seller1@seapedia.com` / `seller123`
2. **Incoming Orders**: Navigate to Orders section
3. Show order with status `sedang_dikemas`
4. Click on the order → show order detail
5. Click "Process Order"
6. **Verify**: Status changes to `menunggu_pengirim`
7. **Verify**: Delivery job appears in driver pool (check in Driver account)

## Flow 6: Driver — Delivery Job

**Time: ~2 minutes**

1. Login as `driver1@seapedia.com` / `driver123`
2. **Available Jobs**: Navigate to Available Jobs
3. Show the job from the processed order
4. Show job detail: store name, address, items, delivery fee (earnings)
5. Click "Take Job"
6. **Verify**: Status changes to `sedang_dikirim`
7. **Active Job**: Show the active delivery
8. Click "Complete Delivery"
9. **Verify**: Status changes to `pesanan_selesai`
10. **Earnings**: Show updated earnings (100% of delivery fee)

## Flow 7: Buyer — Order Tracking

**Time: ~1 minute**

1. Login as `buyer1@seapedia.com` / `buyer123`
2. **Order History**: Navigate to Orders
3. Show order with status `pesanan_selesai`
4. **Order Detail**: Show status timeline with timestamps:
   - `sedang_dikemas` → `menunggu_pengirim` → `sedang_dikirim` → `pesanan_selesai`

## Flow 8: Admin — Monitoring & Discounts

**Time: ~3 minutes**

1. Login as `admin@seapedia.com` / `admin123`
2. **Dashboard**: Show overview stats
   - Users by role
   - Stores, products, orders
   - Order statuses
   - Delivery statuses
3. **Discount Management**:
   - Navigate to Vouchers → show list
   - Create a new voucher
   - Navigate to Promos → show list
   - Create a new promo
4. **Monitoring Pages**: Quickly show Users, Stores, Products, Orders tables

## Flow 9: Admin — Time Simulation & Overdue

**Time: ~3 minutes**

1. Login as `admin@seapedia.com` / `admin123`
2. **Time Simulation**: Navigate to Time Controls
3. Show current time offset
4. Click "Advance 1 Day"
5. **Verify**: Time advances by 24 hours
6. **Overdue Processing**:
   - If there are orders exceeding SLA, they are automatically processed
   - Show results: orders returned, refunds issued
7. **Verify**:
   - Buyer wallet balance increased (refund)
   - Order status changed to `dikembalikan`
   - Status history shows the auto-return entry
   - Product stock restored

## Flow 10: Multi-Role User

**Time: ~1 minute**

1. Login as `multirole@seapedia.com` / `multi123`
2. **Role Selection**: Show all 3 roles available
3. Select "Seller" → Seller Dashboard
4. Switch to "Buyer" → Buyer Dashboard
5. Switch to "Driver" → Driver Dashboard
6. **Verify**: Each dashboard shows role-specific content

## Security Demo (Optional)

**Time: ~2 minutes**

1. **XSS Test**:
   - Submit a review with comment: `<script>alert('XSS')</script>`
   - Verify it renders as plain text
2. **SQL Injection Test**:
   - Input `' OR 1=1 --` into login field
   - Verify it's treated as literal text
3. **RBAC Test**:
   - Login as buyer
   - Try to access `/api/admin/summary` directly
   - Verify 403 Forbidden response

## Timing Summary

| Flow | Time |
|------|------|
| 1. Guest Browsing | ~2 min |
| 2. Registration | ~2 min |
| 3. Seller Setup | ~3 min |
| 4. Buyer Checkout | ~3 min |
| 5. Seller Processing | ~2 min |
| 6. Driver Delivery | ~2 min |
| 7. Order Tracking | ~1 min |
| 8. Admin Monitoring | ~3 min |
| 9. Time Simulation | ~3 min |
| 10. Multi-Role | ~1 min |
| Security (optional) | ~2 min |
| **Total** | **~24 min** |

## Tips for Presenters

1. **Start with the landing page** — it sets the context
2. **Use the multi-role account** for quick switching between roles
3. **Pre-seed some data** if needed — have orders in different states ready
4. **Show the API docs** at `/docs` to demonstrate API completeness
5. **Highlight the financial breakdown** during checkout — it's a key business rule
6. **Show the order timeline** — it demonstrates the full lifecycle
7. **Keep the admin flow concise** — focus on dashboard stats and time simulation
