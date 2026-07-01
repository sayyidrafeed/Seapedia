import { factory } from '@/lib/factory';
import { requireSession } from '@/middleware/auth';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { presignRequestSchema, presignResponseSchema } from '@/lib/upload.schemas';
import { updateProfileSchema, userProfileResponseSchema } from './users.schemas';
import { UsersService } from './users.service';
import { StorageService } from '@/lib/storage';
import { HTTPException } from 'hono/http-exception';
import { ProductReviewsService } from '@/modules/product-reviews/product-reviews.service';
import { productReviewListResponseSchema } from '@/modules/product-reviews/product-reviews.schemas';
import { paginationQuerySchema } from '@/lib/schemas';

export const usersRouter = factory.createApp();

usersRouter.use(requireSession);

usersRouter.post(
  '/me/avatar/presign',
  describeRoute({
    operationId: 'presignUserAvatar',
    tags: ['Users'],
    summary: 'Generate pre-signed URL for avatar upload',
    description:
      'Generates an expiring pre-signed URL for direct upload of a user avatar to Cloudflare R2.',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(presignResponseSchema, 'Presigned URL generated successfully'),
      ...errorResponses(400, 401, 500),
    },
  }),
  validator('json', presignRequestSchema),
  async (c) => {
    const userId = c.get('userId');
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });

    const { mimeType } = c.req.valid('json');
    const result = await UsersService.presignAvatar(userId, mimeType);

    return c.json(result);
  },
);

usersRouter.put(
  '/me',
  describeRoute({
    operationId: 'updateUserProfile',
    tags: ['Users'],
    summary: 'Update current user profile info',
    description: 'Update profile information (e.g. name, avatarKey) for the logged-in user.',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(userProfileResponseSchema, 'Profile updated successfully'),
      ...errorResponses(400, 401, 500),
    },
  }),
  validator('json', updateProfileSchema),
  async (c) => {
    const userId = c.get('userId');
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });

    const body = c.req.valid('json');
    const user = await UsersService.updateProfile(userId, body);

    return c.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatarKey: user.avatarKey,
      avatarUrl: user.avatarKey ? StorageService.getPublicUrl(user.avatarKey) : null,
      isOnboarded: user.isOnboarded,
      createdAt: user.createdAt.toISOString(),
    });
  },
);

usersRouter.get(
  '/me/product-reviews',
  describeRoute({
    operationId: 'getMyProductReviews',
    tags: ['Users'],
    summary: 'Get all product reviews submitted by current user',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(productReviewListResponseSchema, 'User product reviews list'),
      ...errorResponses(401, 500),
    },
  }),
  validator('query', paginationQuerySchema),
  async (c) => {
    const userId = c.get('userId');
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });

    const { page, limit } = c.req.valid('query');
    const result = await ProductReviewsService.getMyProductReviews(userId, { page, limit });

    return c.json({
      reviews: result.reviews.map((r) => ({
        id: r.id,
        productId: r.productId,
        buyerId: r.buyerId,
        reviewerName: r.reviewerName || 'Saya',
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
      total: result.total,
    });
  },
);
