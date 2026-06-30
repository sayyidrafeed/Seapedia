import { z } from 'zod';
import { customMsg } from '@/lib/schemas';

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
    amount: z.coerce
      .number(customMsg('Jumlah top-up wajib diisi', 'Jumlah top-up harus berupa angka'))
      .int('Jumlah top-up harus berupa bilangan bulat')
      .min(10000, 'Jumlah top-up minimal Rp 10.000'),
    paymentMethod: z
      .string(customMsg('Metode pembayaran wajib diisi', 'Metode pembayaran harus berupa teks'))
      .min(1, 'Metode pembayaran wajib diisi'),
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
    label: z
      .string(customMsg('Label wajib diisi', 'Label harus berupa teks'))
      .min(1, 'Label wajib diisi')
      .max(100, 'Label maksimal 100 karakter'),
    recipientName: z
      .string(customMsg('Nama penerima wajib diisi', 'Nama penerima harus berupa teks'))
      .min(1, 'Nama penerima wajib diisi')
      .max(255, 'Nama penerima maksimal 255 karakter'),
    phoneNumber: z
      .string(customMsg('Nomor telepon wajib diisi', 'Nomor telepon harus berupa teks'))
      .min(9, 'Nomor telepon terlalu pendek')
      .max(15, 'Nomor telepon terlalu panjang'),
    province: z
      .string(customMsg('Provinsi wajib diisi', 'Provinsi harus berupa teks'))
      .min(1, 'Provinsi wajib diisi')
      .max(100, 'Provinsi maksimal 100 karakter'),
    city: z
      .string(customMsg('Kota/Kabupaten wajib diisi', 'Kota/Kabupaten harus berupa teks'))
      .min(1, 'Kota/Kabupaten wajib diisi')
      .max(100, 'Kota/Kabupaten maksimal 100 karakter'),
    district: z
      .string(customMsg('Kecamatan wajib diisi', 'Kecamatan harus berupa teks'))
      .min(1, 'Kecamatan wajib diisi')
      .max(100, 'Kecamatan maksimal 100 karakter'),
    postalCode: z
      .string(customMsg('Kode pos wajib diisi', 'Kode pos harus berupa teks'))
      .regex(/^\d{5}$/, 'Kode pos harus tepat 5 digit angka'),
    fullAddress: z
      .string(customMsg('Alamat lengkap wajib diisi', 'Alamat lengkap harus berupa teks'))
      .min(5, 'Alamat lengkap minimal 5 karakter'),
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
