import { z } from 'zod';

export const createVoucherRequestSchema = z
  .object({
    code: z.string().min(1, 'Code is required').trim(),
    discountAmount: z.number().int().positive('Discount amount must be positive'),
    minOrderAmount: z
      .number()
      .int()
      .nonnegative('Minimum order amount must be non-negative')
      .default(0),
    expiresAt: z.string().datetime({ message: 'Invalid expiry date format' }),
    remainingUsage: z.number().int().nonnegative('Remaining usage must be non-negative'),
  })
  .meta({ id: 'CreateVoucherRequest' });

export const createPromoRequestSchema = z
  .object({
    code: z.string().min(1, 'Code is required').trim(),
    discountPercent: z
      .number()
      .int()
      .min(1)
      .max(100, 'Discount percentage must be between 1 and 100'),
    maxDiscountAmount: z
      .number()
      .int()
      .positive('Max discount amount must be positive')
      .nullable()
      .optional(),
    minOrderAmount: z
      .number()
      .int()
      .nonnegative('Minimum order amount must be non-negative')
      .default(0),
    expiresAt: z.string().datetime({ message: 'Invalid expiry date format' }),
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
    code: z.string().min(1, 'Discount code is required').trim(),
    subtotal: z.number().int().positive('Subtotal must be positive'),
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
