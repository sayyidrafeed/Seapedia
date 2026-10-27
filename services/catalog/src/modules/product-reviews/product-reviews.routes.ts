import { factory } from '@seapedia/platform/factory';
import { requireRole, requireSession } from '@seapedia/platform/auth';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@seapedia/platform/openapi';
import { z } from 'zod';
import { paginationQuerySchema } from '@seapedia/platform/schemas';
import {
  submitProductReviewSchema,
  productReviewResponseSchema,
  productReviewListResponseSchema,
} from './product-reviews.schemas';
import { ProductReviewsService } from './product-reviews.service';

export const productReviewsRouter = factory.createApp();

productReviewsRouter.post(
  '/:id/reviews',
  describeRoute({
    operationId: 'submitProductReview',
    tags: ['Product Reviews'],
    summary: 'Submit a product review (Buyer only)',
    security: [{ cookieAuth: [] }],
    responses: {
      201: jsonContent(productReviewResponseSchema, 'Review submitted successfully'),
      ...errorResponses(400, 401, 403, 404, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  validator('param', z.object({ id: z.string() })),
  validator('json', submitProductReviewSchema),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');

    const review = await ProductReviewsService.createReview(userId, id, body);

    c.status(201);
    return c.json({
      id: review.id,
      productId: review.productId,
      buyerId: review.buyerId,
      reviewerName: review.reviewerName,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    });
  },
);

productReviewsRouter.get(
  '/:id/reviews',
  describeRoute({
    operationId: 'getProductReviews',
    tags: ['Product Reviews'],
    summary: 'Get product reviews list (Public)',
    responses: {
      200: jsonContent(productReviewListResponseSchema, 'Product reviews list'),
      ...errorResponses(400, 500),
    },
  }),
  validator('param', z.object({ id: z.string() })),
  validator('query', paginationQuerySchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const { page, limit } = c.req.valid('query');

    const result = await ProductReviewsService.getProductReviews(id, { page, limit });

    return c.json({
      reviews: result.reviews.map((r) => ({
        id: r.id,
        productId: r.productId,
        buyerId: r.buyerId,
        reviewerName: r.reviewerName || 'Pembeli',
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
      total: result.total,
    });
  },
);

productReviewsRouter.get(
  '/reviews/me',
  describeRoute({
    operationId: 'getMyProductReviews',
    tags: ['Product Reviews'],
    summary: 'Get all product reviews submitted by current user',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(productReviewListResponseSchema, 'User product reviews list'),
      ...errorResponses(401, 500),
    },
  }),
  requireSession,
  validator('query', paginationQuerySchema),
  async (c) => {
    const userId = c.get('userId');
    const { page, limit } = c.req.valid('query');
    const result = await ProductReviewsService.getMyProductReviews(userId, { page, limit });

    return c.json({
      reviews: result.reviews.map((r) => ({
        id: r.id,
        productId: r.productId,
        buyerId: r.buyerId,
        reviewerName: r.reviewerName,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
      total: result.total,
    });
  },
);
