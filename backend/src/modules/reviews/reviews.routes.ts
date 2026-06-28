import { factory } from '@/lib/factory';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import {
  submitReviewSchema,
  reviewResponseSchema,
  reviewListResponseSchema,
} from './reviews.schemas';
import { ReviewsService } from './reviews.service';

export const reviewsRouter = factory.createApp();

reviewsRouter.get(
  '/',
  describeRoute({
    operationId: 'listReviews',
    tags: ['Reviews'],
    summary: 'List all public application reviews',
    responses: {
      200: jsonContent(reviewListResponseSchema, 'List of app reviews'),
      ...errorResponses(500),
    },
  }),
  async (c) => {
    const list = await ReviewsService.listReviews();
    const formatted = list.map((r) => ({
      id: r.id,
      reviewerName: r.reviewerName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }));

    return c.json(formatted);
  },
);

reviewsRouter.post(
  '/',
  describeRoute({
    operationId: 'submitReview',
    tags: ['Reviews'],
    summary: 'Submit a new application review (public/guest)',
    responses: {
      201: jsonContent(reviewResponseSchema, 'Review submitted successfully'),
      ...errorResponses(400, 500),
    },
  }),
  validator('json', submitReviewSchema),
  async (c) => {
    const body = c.req.valid('json');
    const review = await ReviewsService.createReview(body);

    c.status(201);
    return c.json({
      id: review.id,
      reviewerName: review.reviewerName,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    });
  },
);
