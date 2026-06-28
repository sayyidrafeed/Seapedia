import { z } from 'zod';

export const productSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    price: z.number(),
    stock: z.number(),
    storeName: z.string(),
  })
  .meta({ id: 'Product' });

export const productListResponseSchema = z
  .object({
    products: z.array(productSchema),
    total: z.number(),
  })
  .meta({ id: 'ProductListResponse' });
