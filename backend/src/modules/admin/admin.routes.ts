import { factory } from '@/lib/factory';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { requireSession, requireRole } from '@/middleware/auth';
import {
  dashboardStatsResponseSchema,
  simulateTimeRequestSchema,
  simulateTimeResponseSchema,
  processOverdueResponseSchema,
} from './admin.schemas';
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

dashboardRouter.post(
  '/dashboard/overdue/process',
  describeRoute({
    operationId: 'processOverdueOrders',
    tags: ['Admin Dashboard'],
    summary: 'Process overdue orders by auto-returning and refunding them',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(processOverdueResponseSchema, 'Overdue orders processed successfully'),
      ...errorResponses(401, 403, 500),
    },
  }),
  requireSession,
  requireRole('admin'),
  async (c) => {
    const result = await AdminService.processOverdueOrders();
    return c.json(result);
  },
);

dashboardRouter.post(
  '/dashboard/time/simulate',
  describeRoute({
    operationId: 'simulateTime',
    tags: ['Admin Dashboard'],
    summary: 'Simulate system time forward for demo purposes',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(simulateTimeResponseSchema, 'System time offset updated successfully'),
      ...errorResponses(400, 401, 403, 500),
    },
  }),
  requireSession,
  requireRole('admin'),
  validator('json', simulateTimeRequestSchema),
  async (c) => {
    const { hoursToAdvance } = c.req.valid('json');
    const result = await AdminService.simulateTime(hoursToAdvance);
    return c.json(result);
  },
);
