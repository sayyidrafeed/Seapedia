import { factory } from '@/lib/factory';
import { describeRoute } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { requireSession, requireRole } from '@/middleware/auth';
import { dashboardStatsResponseSchema } from './admin.schemas';
import { AdminService } from './admin.service';

export const dashboardRouter = factory.createApp();

dashboardRouter.get(
  '/dashboard',
  describeRoute({
    operationId: 'getDashboardStats',
    tags: ['Admin Dashboard'],
    summary: 'Get dashboard statistics for admin monitoring',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(dashboardStatsResponseSchema, 'Dashboard statistics fetched successfully'),
      ...errorResponses(401, 403, 500),
    },
  }),
  requireSession,
  requireRole('admin'),
  async (c) => {
    const stats = await AdminService.getDashboardStats();
    return c.json(stats);
  },
);
