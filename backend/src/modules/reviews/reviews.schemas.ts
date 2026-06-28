import { z } from 'zod';

export const submitReviewSchema = z
  .object({
    reviewerName: z.string().min(1, 'Reviewer name is required').max(100),
    rating: z.coerce
      .number()
      .int()
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5'),
    comment: z.string().min(1, 'Comment is required').max(1000),
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
