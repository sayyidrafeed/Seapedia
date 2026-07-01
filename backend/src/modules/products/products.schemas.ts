import { z } from 'zod';
import { customMsg } from '@/lib/schemas';

export const productSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.number(),
    currency: z.string().default('IDR'),
    stock: z.number(),
    storeId: z.string(),
    storeName: z.string(),
    storeSlug: z.string(),
    slug: z.string(),
    imageKey: z.string().nullable(),
    imageUrl: z.string().nullable(),
    rating: z.string().default('0.00'),
    reviewCount: z.number().default(0),
    soldCount: z.number().default(0),
    storeRating: z.string().default('0.00'),
    storeReviewCount: z.number().default(0),
    storeLogoKey: z.string().nullable().optional(),
    storeLogoUrl: z.string().nullable().optional(),
    storeTotalProducts: z.number().default(0),
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
    name: z
      .string(customMsg('Nama produk wajib diisi', 'Nama produk harus berupa teks'))
      .min(1, 'Nama produk wajib diisi')
      .max(255, 'Nama produk maksimal 255 karakter'),
    description: z
      .string({
        message: 'Deskripsi harus berupa teks',
      })
      .optional()
      .nullable(),
    price: z
      .number(customMsg('Harga wajib diisi', 'Harga harus berupa angka'))
      .int('Harga harus berupa bilangan bulat')
      .nonnegative('Harga tidak boleh bernilai negatif'),
    stock: z
      .number(customMsg('Stok wajib diisi', 'Stok harus berupa angka'))
      .int('Stok harus berupa bilangan bulat')
      .nonnegative('Stok tidak boleh bernilai negatif'),
    imageKey: z
      .string({
        message: 'Image key harus berupa teks',
      })
      .trim()
      .max(512)
      .optional()
      .nullable(),
  })
  .meta({ id: 'CreateProduct' });

export const updateProductSchema = z
  .object({
    name: z
      .string({
        message: 'Nama produk harus berupa teks',
      })
      .min(1, 'Nama produk tidak boleh kosong')
      .max(255, 'Nama produk maksimal 255 karakter')
      .optional(),
    description: z
      .string({
        message: 'Deskripsi harus berupa teks',
      })
      .optional()
      .nullable(),
    price: z
      .number({
        message: 'Harga harus berupa angka',
      })
      .int('Harga harus berupa bilangan bulat')
      .nonnegative('Harga tidak boleh bernilai negatif')
      .optional(),
    stock: z
      .number({
        message: 'Stok harus berupa angka',
      })
      .int('Stok harus berupa bilangan bulat')
      .nonnegative('Stok tidak boleh bernilai negatif')
      .optional(),
    imageKey: z
      .string({
        message: 'Image key harus berupa teks',
      })
      .trim()
      .max(512)
      .optional()
      .nullable(),
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
    imageKey: z.string().nullable(),
    imageUrl: z.string().nullable(),
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
