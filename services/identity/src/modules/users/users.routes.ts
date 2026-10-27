import { factory } from '@seapedia/platform/factory';
import { requireSession } from '@seapedia/platform/auth';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@seapedia/platform/openapi';
import { presignRequestSchema, presignResponseSchema } from '@seapedia/platform/upload.schemas';
import { updateProfileSchema, userProfileResponseSchema } from './users.schemas';
import { UsersService } from './users.service';
import { StorageService } from '@/lib/storage';

export const usersRouter = factory.createApp();

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
  requireSession,
  validator('json', presignRequestSchema),
  async (c) => {
    const userId = c.get('userId');
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
  requireSession,
  validator('json', updateProfileSchema),
  async (c) => {
    const userId = c.get('userId');
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
