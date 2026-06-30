import { z } from 'zod';
import { customMsg } from '@/lib/schemas';

export const createVoucherRequestSchema = z
  .object({
    code: z
      .string(customMsg('Kode wajib diisi', 'Kode harus berupa teks'))
      .min(1, 'Kode wajib diisi')
      .trim(),
    discountAmount: z
      .number(customMsg('Jumlah diskon wajib diisi', 'Jumlah diskon harus berupa angka'))
      .int('Jumlah diskon harus berupa bilangan bulat')
      .positive('Jumlah diskon harus bernilai positif'),
    minOrderAmount: z
      .number({
        message: 'Minimal pembelian harus berupa angka',
      })
      .int('Minimal pembelian harus berupa bilangan bulat')
      .nonnegative('Minimal pembelian tidak boleh negatif')
      .default(0),
    expiresAt: z
      .string(customMsg('Tanggal kedaluwarsa wajib diisi', 'Tanggal kedaluwarsa harus berupa teks'))
      .datetime({ message: 'Format tanggal kedaluwarsa tidak valid' }),
    remainingUsage: z
      .number(
        customMsg('Sisa kuota penggunaan wajib diisi', 'Sisa kuota penggunaan harus berupa angka'),
      )
      .int('Sisa kuota penggunaan harus berupa bilangan bulat')
      .nonnegative('Sisa kuota penggunaan tidak boleh negatif'),
  })
  .meta({ id: 'CreateVoucherRequest' });

export const createPromoRequestSchema = z
  .object({
    code: z
      .string(customMsg('Kode wajib diisi', 'Kode harus berupa teks'))
      .min(1, 'Kode wajib diisi')
      .trim(),
    discountPercent: z
      .number(customMsg('Persentase diskon wajib diisi', 'Persentase diskon harus berupa angka'))
      .int('Persentase diskon harus berupa bilangan bulat')
      .min(1, 'Persentase diskon minimal 1')
      .max(100, 'Persentase diskon maksimal 100'),
    maxDiscountAmount: z
      .number({
        message: 'Maksimal diskon harus berupa angka',
      })
      .int('Maksimal diskon harus berupa bilangan bulat')
      .positive('Maksimal jumlah diskon harus bernilai positif')
      .nullable()
      .optional(),
    minOrderAmount: z
      .number({
        message: 'Minimal pembelian harus berupa angka',
      })
      .int('Minimal pembelian harus berupa bilangan bulat')
      .nonnegative('Minimal pembelian tidak boleh negatif')
      .default(0),
    expiresAt: z
      .string(customMsg('Tanggal kedaluwarsa wajib diisi', 'Tanggal kedaluwarsa harus berupa teks'))
      .datetime({ message: 'Format tanggal kedaluwarsa tidak valid' }),
  })
  .meta({ id: 'CreatePromoRequest' });

export const voucherResponseSchema = z
  .object({
    id: z.string().uuid(),
    code: z.string(),
    discountAmount: z.number().int(),
    minOrderAmount: z.number().int(),
    expiresAt: z.string(),
    remainingUsage: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ id: 'VoucherResponse' });

export const promoResponseSchema = z
  .object({
    id: z.string().uuid(),
    code: z.string(),
    discountPercent: z.number().int(),
    maxDiscountAmount: z.number().int().nullable(),
    minOrderAmount: z.number().int(),
    expiresAt: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ id: 'PromoResponse' });

export const voucherListResponseSchema = z
  .array(voucherResponseSchema)
  .meta({ id: 'VoucherListResponse' });
export const promoListResponseSchema = z
  .array(promoResponseSchema)
  .meta({ id: 'PromoListResponse' });

export const validateDiscountRequestSchema = z
  .object({
    code: z
      .string(customMsg('Kode diskon wajib diisi', 'Kode diskon harus berupa teks'))
      .min(1, 'Kode diskon wajib diisi')
      .trim(),
    subtotal: z
      .number(customMsg('Subtotal wajib diisi', 'Subtotal harus berupa angka'))
      .int('Subtotal harus berupa bilangan bulat')
      .positive('Subtotal harus bernilai positif'),
  })
  .meta({ id: 'ValidateDiscountRequest' });

export const validateDiscountResponseSchema = z
  .object({
    type: z.enum(['voucher', 'promo']),
    code: z.string(),
    discountAmount: z.number().int(),
    description: z.string(),
  })
  .meta({ id: 'ValidateDiscountResponse' });
