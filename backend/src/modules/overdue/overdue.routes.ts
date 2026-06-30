import { factory } from '@/lib/factory';
import { describeRoute } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { requireSession, requireRole } from '@/middleware/auth';
import { simulateDayResponseSchema, processOverdueResponseSchema } from './overdue.schemas';
import { OverdueService } from './overdue.service';

export const overdueAdminRouter = factory.createApp();

overdueAdminRouter.post(
  '/simulate-day',
  describeRoute({
    tags: ['Admin Overdue'],
    operationId: 'simulateDay',
    summary: 'Advance simulation time by one day',
    description: 'Increments the day offset used for overdue SLA calculations.',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(simulateDayResponseSchema, 'Simulation day advanced'),
      ...errorResponses([401, 403, 500]),
    },
  }),
  requireSession,
  requireRole('admin'),
  async (c) => {
    const dayOffset = await OverdueService.simulateDay();
    return c.json({
      dayOffset,
      message: `Simulation advanced to day offset +${dayOffset}.`,
    });
  },
);

overdueAdminRouter.post(
  '/overdue/process',
  describeRoute({
    tags: ['Admin Overdue'],
    operationId: 'processOverdue',
    summary: 'Process all overdue orders',
    description:
      'Finds orders beyond their delivery SLA and applies auto-return/refund. Instant and Next Day orders are refunded. Regular orders are refunded with stock restoration.',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(processOverdueResponseSchema, 'Overdue orders processed'),
      ...errorResponses([401, 403, 500]),
    },
  }),
  requireSession,
  requireRole('admin'),
  async (c) => {
    const result = await OverdueService.processOverdueOrders();
    return c.json(result);
  },
);
