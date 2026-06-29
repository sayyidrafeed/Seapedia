import { z } from 'zod';

export const createStoreSchema = z
  .object({
    name: z.string().trim().min(3).max(255),
    description: z.string().optional(),
  })
  .meta({ id: 'CreateStoreInput' });

export const updateStoreSchema = z
  .object({
    name: z.string().trim().min(3).max(255).optional(),
    description: z.string().optional(),
  })
  .meta({ id: 'UpdateStoreInput' });

export const storeResponseSchema = z
  .object({
    id: z.string(),
    sellerId: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ id: 'StoreResponse' });
