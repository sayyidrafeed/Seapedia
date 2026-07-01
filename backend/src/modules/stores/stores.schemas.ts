import { z } from 'zod';
import { customMsg } from '@/lib/schemas';

export const createStoreSchema = z
  .object({
    name: z
      .string(customMsg('Nama toko wajib diisi', 'Nama toko harus berupa teks'))
      .trim()
      .min(3, 'Nama toko minimal 3 karakter')
      .max(255, 'Nama toko maksimal 255 karakter'),
    description: z
      .string({
        message: 'Deskripsi harus berupa teks',
      })
      .optional(),
  })
  .meta({ id: 'CreateStoreInput' });

export const updateStoreSchema = z
  .object({
    name: z
      .string({
        message: 'Nama toko harus berupa teks',
      })
      .trim()
      .min(3, 'Nama toko minimal 3 karakter')
      .max(255, 'Nama toko maksimal 255 karakter')
      .optional(),
    description: z
      .string({
        message: 'Deskripsi harus berupa teks',
      })
      .optional(),
  })
  .meta({ id: 'UpdateStoreInput' });

export const storeResponseSchema = z
  .object({
    id: z.string(),
    sellerId: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ id: 'StoreResponse' });
