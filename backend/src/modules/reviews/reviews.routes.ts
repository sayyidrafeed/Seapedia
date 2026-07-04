import { factory } from '@/lib/factory';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import {
  submitReviewSchema,
  reviewResponseSchema,
  reviewListResponseSchema,
  reviewStatsResponseSchema,
} from './reviews.schemas';
import { ReviewsService } from './reviews.service';
import { paginationQuerySchema } from '@/lib/schemas';

export const reviewsRouter = factory.createApp();

reviewsRouter.get(
  '/',
  describeRoute({
    operationId: 'listReviews',
    tags: ['Reviews'],
    summary: 'List all public application reviews with pagination',
    responses: {
      200: jsonContent(reviewListResponseSchema, 'List of app reviews'),
      ...errorResponses(500),
    },
  }),
  validator('query', paginationQuerySchema),
  async (c) => {
    const { page, limit } = c.req.valid('query');
    const offset = (page - 1) * limit;

    const list = await ReviewsService.listReviews({ limit, offset });
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

reviewsRouter.get(
  '/stats',
  describeRoute({
    operationId: 'getReviewsStats',
    tags: ['Reviews'],
    summary: 'Get application reviews statistics (total count and average rating)',
    responses: {
      200: jsonContent(reviewStatsResponseSchema, 'Review statistics'),
      ...errorResponses(500),
    },
  }),
  async (c) => {
    const stats = await ReviewsService.getReviewsStats();
    return c.json(stats);
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
