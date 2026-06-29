import { factory } from '@/lib/factory';
import { describeRoute } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { requireSession, requireRole } from '@/middleware/auth';
import { z } from 'zod';

const privateMessageSchema = z
  .object({
    message: z.string(),
    activeRole: z.string(),
  })
  .meta({ id: 'PrivateMessage' });

// Shared description for role-protected endpoints
function roleResponse(role: string) {
  return {
    200: jsonContent(privateMessageSchema, `Private ${role} endpoint message`),
    ...errorResponses(401, 403, 500),
  };
}

export const privateRouter = factory.createApp();

privateRouter.get(
  '/admin',
  describeRoute({
    operationId: 'privateAdminEndpoint',
    tags: ['Private'],
    summary: 'Private endpoint accessible only by Admin role',
    security: [{ cookieAuth: [] }],
    responses: roleResponse('admin'),
  }),
  requireSession,
  requireRole('admin'),
  async (c) => {
    return c.json({
      message: 'This endpoint can only be used by users with the Admin role.',
      activeRole: c.get('activeRole')!,
    });
  },
);

privateRouter.get(
  '/seller',
  describeRoute({
    operationId: 'privateSellerEndpoint',
    tags: ['Private'],
    summary: 'Private endpoint accessible only by Seller role',
    security: [{ cookieAuth: [] }],
    responses: roleResponse('seller'),
  }),
  requireSession,
  requireRole('seller'),
  async (c) => {
    return c.json({
      message: 'This endpoint can only be used by users with the Seller role.',
      activeRole: c.get('activeRole')!,
    });
  },
);

privateRouter.get(
  '/buyer',
  describeRoute({
    operationId: 'privateBuyerEndpoint',
    tags: ['Private'],
    summary: 'Private endpoint accessible only by Buyer role',
    security: [{ cookieAuth: [] }],
    responses: roleResponse('buyer'),
  }),
  requireSession,
  requireRole('buyer'),
  async (c) => {
    return c.json({
      message: 'This endpoint can only be used by users with the Buyer role.',
      activeRole: c.get('activeRole')!,
    });
  },
);

privateRouter.get(
  '/driver',
  describeRoute({
    operationId: 'privateDriverEndpoint',
    tags: ['Private'],
    summary: 'Private endpoint accessible only by Driver role',
    security: [{ cookieAuth: [] }],
    responses: roleResponse('driver'),
  }),
  requireSession,
  requireRole('driver'),
  async (c) => {
    return c.json({
      message: 'This endpoint can only be used by users with the Driver role.',
      activeRole: c.get('activeRole')!,
    });
  },
);
