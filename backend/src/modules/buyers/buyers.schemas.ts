import { z } from 'zod';

export const walletResponseSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    balance: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ id: 'WalletResponse' });

export const walletTransactionResponseSchema = z
  .object({
    id: z.string(),
    walletId: z.string(),
    amount: z.number().int(),
    type: z.string(),
    paymentMethod: z.string().nullable(),
    status: z.string(),
    reference: z.string(),
    createdAt: z.string(),
  })
  .meta({ id: 'WalletTransactionResponse' });

export const walletTransactionsListSchema = z
  .array(walletTransactionResponseSchema)
  .meta({ id: 'WalletTransactionsList' });

export const topUpRequestSchema = z
  .object({
    amount: z.coerce.number().int().min(10000, 'Minimum top-up amount is Rp 10.000'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
  })
  .meta({ id: 'TopUpRequest' });

export const topUpResponseSchema = z
  .object({
    transaction: walletTransactionResponseSchema,
    paymentInstructions: z.object({
      virtualAccount: z.string().optional(),
      qrCode: z.string().optional(),
      expiryTime: z.string(),
    }),
  })
  .meta({ id: 'TopUpResponse' });

export const addressRequestSchema = z
  .object({
    label: z.string().min(1, 'Label is required').max(100),
    recipientName: z.string().min(1, 'Recipient name is required').max(255),
    phoneNumber: z.string().min(9, 'Phone number is too short').max(15, 'Phone number is too long'),
    province: z.string().min(1, 'Province is required').max(100),
    city: z.string().min(1, 'City is required').max(100),
    district: z.string().min(1, 'District is required').max(100),
    postalCode: z.string().regex(/^\d{5}$/, 'Postal code must be exactly 5 digits'),
    fullAddress: z.string().min(5, 'Full address must be at least 5 characters'),
    isDefault: z.boolean().default(false),
  })
  .meta({ id: 'AddressRequest' });

export const addressResponseSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    label: z.string(),
    recipientName: z.string(),
    phoneNumber: z.string(),
    province: z.string(),
    city: z.string(),
    district: z.string(),
    postalCode: z.string(),
    fullAddress: z.string(),
    isDefault: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ id: 'AddressResponse' });

export const addressListResponseSchema = z
  .array(addressResponseSchema)
  .meta({ id: 'AddressListResponse' });
