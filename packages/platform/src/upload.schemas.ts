import { z } from 'zod';

export const presignRequestSchema = z
  .object({
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
      message: 'Format gambar tidak valid. Hanya JPEG, PNG, dan WEBP yang didukung',
    }),
  })
  .meta({ id: 'PresignRequest' });

export const presignResponseSchema = z
  .object({
    uploadUrl: z.string(),
    objectKey: z.string(),
    publicUrl: z.string(),
  })
  .meta({ id: 'PresignResponse' });
