# Seller Flow

Sellers are store owners who manage products and process incoming orders.

## Seller Dashboard

After selecting the Seller role, the seller accesses the Seller Dashboard with these sections:

| Section | Description |
|---------|-------------|
| Store Profile | View/edit store name, description, logo |
| Products | CRUD for products under their store |
| Incoming Orders | Orders waiting to be processed |
| Income Report | Revenue summary from completed orders |

## Store Management

### Creating a Store

1. Navigate to Store Profile
2. Enter store name (must be unique)
3. Add description
4. Upload store logo (via R2 presigned URL)
5. Save

### Store Rules

- Store name must be **unique** across the platform
- A seller can only manage **one store**
- Store name uniqueness is enforced via database constraint

## Product Management

### Create Product

1. Navigate to Products section
2. Click "Add Product"
3. Fill in: name, description, price (IDR), stock
4. Upload product image (via R2 presigned URL)
5. Save

### Update Product

1. Navigate to Products section
2. Click on a product
3. Edit fields
4. Save

### Delete Product

1. Navigate to Products section
2. Click on a product
3. Click "Delete"
4. Confirm deletion

### Product Rules

- Products must belong to the seller's store
- Price must be non-negative
- Stock must be non-negative
- Product images use R2 presigned URLs

## Order Processing

### Incoming Orders

1. Navigate to Incoming Orders
2. View orders with status `sedang_dikemas`
3. Click on an order to see details
4. Click "Process Order" to confirm packing
5. Status changes to `menunggu_pengirim`
6. A delivery job is automatically created for drivers

### Processing Rules

- Only the seller who owns the order can process it
- Processing creates a delivery job for the driver pool
- Order status is recorded in status history with timestamp

### Order Timeline

The seller can view the full order timeline:

```
sedang_dikemas → menunggu_pengirim → [waiting for driver]
```

## Income Report

The seller income report shows:

- Total income from completed orders
- Income breakdown by order
- Only counts `pesanan_selesai` orders
- Uses `subtotal` (excludes delivery fee and PPN)

### Calculation

```
Seller Income = Σ (order.subtotal) for orders where status = 'pesanan_selesai'
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores` | List all stores |
| GET | `/api/stores/:slug` | Get store detail |
| PUT | `/api/seller/store` | Update store profile |
| POST | `/api/stores/:storeId/logo/presign` | Get presigned URL for logo upload |
| POST | `/api/seller/products` | Create product |
| PUT | `/api/seller/products/:productId` | Update product |
| DELETE | `/api/seller/products/:productId` | Delete product |
| POST | `/api/products/image/presign` | Get presigned URL for product image |
| GET | `/api/seller/orders` | List incoming orders |
| GET | `/api/seller/orders/:orderId` | Get order detail |
| POST | `/api/seller/orders/:orderId/process` | Process order |
| GET | `/api/seller/orders/report` | Income report |

## Code References

| Component | File |
|-----------|------|
| Store service | `backend/src/modules/stores/stores.service.ts` |
| Product service | `backend/src/modules/products/products.service.ts` |
| Seller order service | `backend/src/modules/orders/orders-seller.service.ts` |
| Store routes | `backend/src/modules/stores/stores.routes.ts` |
| Seller routes | `backend/src/modules/orders/orders-routes.ts` |
| Frontend seller features | `frontend/src/features/seller/` |
