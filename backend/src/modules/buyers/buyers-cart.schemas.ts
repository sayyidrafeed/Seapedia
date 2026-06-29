import { z } from 'zod';

export const cartItemRequestSchema = z
  .object({
    productId: z.string().uuid('Invalid product ID format'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  })
  .meta({ id: 'CartItemRequest' });

export const updateCartItemRequestSchema = z
  .object({
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  })
  .meta({ id: 'UpdateCartItemRequest' });

export const cartProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number().int(),
  stock: z.number().int(),
});

export const cartItemResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  quantity: z.number().int(),
  product: cartProductSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const cartSummaryResponseSchema = z
  .object({
    id: z.string(),
    buyerId: z.string(),
    storeId: z.string().nullable(),
    storeName: z.string().nullable(),
    storeSlug: z.string().nullable(),
    items: z.array(cartItemResponseSchema),
    subtotal: z.number().int(),
    totalItems: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ id: 'CartSummaryResponse' });
