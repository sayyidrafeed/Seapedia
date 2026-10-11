import { z } from 'zod';
import { userResponseSchema } from '@/modules/auth/auth.schemas';

export const updateProfileSchema = z
  .object({
    name: z
      .string({
        message: 'Nama harus berupa teks',
      })
      .trim()
      .max(255, 'Nama maksimal 255 karakter')
      .optional(),
    avatarKey: z
      .string({
        message: 'Avatar key harus berupa teks',
      })
      .trim()
      .max(512)
      .optional()
      .nullable(),
  })
  .meta({ id: 'UpdateProfileInput' });

export const userProfileResponseSchema = userResponseSchema;
