import { z } from 'zod';

export const productSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    price: z.number(),
    currency: z.string().default('IDR'),
    stock: z.number(),
    storeName: z.string(),
    storeSlug: z.string(),
    slug: z.string(),
  })
  .meta({ id: 'Product' });

export const productListResponseSchema = z
  .object({
    products: z.array(productSchema),
    total: z.number(),
  })
  .meta({ id: 'ProductListResponse' });

export const createProductSchema = z
  .object({
    name: z.string().min(1, 'Product name is required').max(255),
    description: z.string().optional().nullable(),
    price: z.number().int().nonnegative('Price must be a positive integer (IDR)'),
    stock: z.number().int().nonnegative('Stock must be a non-negative integer'),
  })
  .meta({ id: 'CreateProduct' });

export const updateProductSchema = z
  .object({
    name: z.string().min(1, 'Product name is required').max(255).optional(),
    description: z.string().optional().nullable(),
    price: z.number().int().nonnegative('Price must be a positive integer (IDR)').optional(),
    stock: z.number().int().nonnegative('Stock must be a non-negative integer').optional(),
  })
  .meta({ id: 'UpdateProduct' });

export const sellerProductResponseSchema = z
  .object({
    id: z.string(),
    storeId: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.number(),
    stock: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ id: 'SellerProductResponse' });

export const sellerProductListResponseSchema = z
  .object({
    products: z.array(sellerProductResponseSchema),
    total: z.number(),
  })
  .meta({ id: 'SellerProductListResponse' });
