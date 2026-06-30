import { z } from 'zod';
import { customMsg } from '@/lib/schemas';

export const submitReviewSchema = z
  .object({
    reviewerName: z
      .string(customMsg('Nama pengulas wajib diisi', 'Nama pengulas harus berupa teks'))
      .min(1, 'Nama pengulas wajib diisi')
      .max(100, 'Nama pengulas maksimal 100 karakter'),
    rating: z.coerce
      .number(customMsg('Rating wajib diisi', 'Rating harus berupa angka'))
      .int('Rating harus berupa bilangan bulat')
      .min(1, 'Rating minimal 1')
      .max(5, 'Rating maksimal 5'),
    comment: z
      .string(customMsg('Komentar wajib diisi', 'Komentar harus berupa teks'))
      .min(1, 'Komentar wajib diisi')
      .max(1000, 'Komentar maksimal 1000 karakter'),
  })
  .meta({ id: 'SubmitReviewInput' });

export const reviewResponseSchema = z
  .object({
    id: z.string(),
    reviewerName: z.string(),
    rating: z.number(),
    comment: z.string(),
    createdAt: z.string(),
  })
  .meta({ id: 'Review' });

export const reviewListResponseSchema = z.array(reviewResponseSchema).meta({ id: 'ReviewList' });
