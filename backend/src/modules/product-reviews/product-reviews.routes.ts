import { factory } from '@/lib/factory';
import { requireRole, requireSession } from '@/middleware/auth';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { z } from 'zod';
import { paginationQuerySchema } from '@/lib/schemas';
import {
  submitProductReviewSchema,
  productReviewResponseSchema,
  productReviewListResponseSchema,
} from './product-reviews.schemas';
import { ProductReviewsService } from './product-reviews.service';
import { HTTPException } from 'hono/http-exception';

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
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });

    const { id } = c.req.valid('param');
    const body = c.req.valid('json');

    const review = await ProductReviewsService.createReview(userId, id, body);

    c.status(201);
    return c.json({
      id: review.id,
      productId: review.productId,
      buyerId: review.buyerId,
      reviewerName: 'Saya', // Will be displayed as the logged in user
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
