import { z } from 'zod';
import { customMsg } from '@/lib/schemas';

export const registerSchema = z
  .object({
    username: z
      .string(customMsg('Username wajib diisi', 'Username harus berupa teks'))
      .min(3, 'Username minimal 3 karakter')
      .max(50, 'Username maksimal 50 karakter'),
    email: z
      .string(customMsg('Email wajib diisi', 'Email harus berupa teks'))
      .email('Format email tidak valid'),
    password: z
      .string(customMsg('Password wajib diisi', 'Password harus berupa teks'))
      .min(8, 'Password minimal 8 karakter'),
    name: z
      .string({
        message: 'Nama harus berupa teks',
      })
      .optional(),
  })
  .meta({ id: 'RegisterInput' });

export const loginSchema = z
  .object({
    username: z
      .string(customMsg('Username wajib diisi', 'Username harus berupa teks'))
      .min(1, 'Username tidak boleh kosong'),
    password: z
      .string(customMsg('Password wajib diisi', 'Password harus berupa teks'))
      .min(1, 'Password tidak boleh kosong'),
  })
  .meta({ id: 'LoginInput' });

export const selectRoleSchema = z
  .object({
    role: z.enum(['admin', 'seller', 'buyer', 'driver'], {
      message: 'Role tidak valid',
    }),
  })
  .meta({ id: 'SelectRoleInput' });

export const userResponseSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    avatarKey: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    isOnboarded: z.boolean(),
    createdAt: z.string(),
  })
  .meta({ id: 'UserResponse' });

export const onboardSchema = z
  .object({
    roles: z.array(
      z.enum(['buyer', 'seller', 'driver'], {
        message: 'Role tidak valid',
      }),
      customMsg('Pilih minimal satu role', 'Role harus berupa list'),
    ),
  })
  .meta({ id: 'OnboardInput' });

export const sessionResponseSchema = z
  .object({
    userId: z.string(),
    activeRole: z.string(),
    roles: z.array(z.string()),
  })
  .meta({ id: 'SessionResponse' });

export const financialSummarySchema = z
  .object({
    buyer: z
      .object({
        balance: z.number(),
      })
      .optional(),
    seller: z
      .object({
        income: z.number(),
      })
      .optional(),
    driver: z
      .object({
        earnings: z.number(),
      })
      .optional(),
  })
  .meta({ id: 'FinancialSummary' });
