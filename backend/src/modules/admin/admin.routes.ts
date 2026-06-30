import { factory } from '@/lib/factory';
import { describeRoute } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { requireSession, requireRole } from '@/middleware/auth';
import { adminMonitoringResponseSchema } from './admin.schemas';
import { AdminService } from './admin.service';

export const adminRouter = factory.createApp();

adminRouter.get(
  '/monitoring',
  describeRoute({
    operationId: 'adminMonitoringEndpoint',
    tags: ['Admin Monitoring'],
    summary: 'Get marketplace monitoring statistics',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(
        adminMonitoringResponseSchema,
        'Monitoring statistics retrieved successfully',
      ),
      ...errorResponses(401, 403, 500),
    },
  }),
  requireSession,
  requireRole('admin'),
  async (c) => {
    const stats = await AdminService.getMonitoringStats();
    return c.json(stats);
  },
);
