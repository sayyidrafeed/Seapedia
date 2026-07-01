import { z } from 'zod';
import { customMsg } from '@/lib/schemas';

export const submitProductReviewSchema = z
  .object({
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
  .meta({ id: 'SubmitProductReview' });

export const productReviewResponseSchema = z
  .object({
    id: z.string(),
    productId: z.string(),
    buyerId: z.string(),
    reviewerName: z.string(),
    rating: z.number(),
    comment: z.string(),
    createdAt: z.string(),
  })
  .meta({ id: 'ProductReviewResponse' });

export const productReviewListResponseSchema = z
  .object({
    reviews: z.array(productReviewResponseSchema),
    total: z.number(),
  })
  .meta({ id: 'ProductReviewListResponse' });
