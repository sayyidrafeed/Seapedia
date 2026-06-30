import { factory } from '@/lib/factory';
import { describeRoute } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { requireSession, requireRole } from '@/middleware/auth';
import { deliveryJobListResponseSchema, deliveryJobResponseSchema } from './driver.schemas';
import { DriverService } from './driver.service';

export const driverRouter = factory.createApp();

// Get Available Delivery Jobs
driverRouter.get(
  '/jobs',
  describeRoute({
    operationId: 'listAvailableJobs',
    tags: ['Driver'],
    summary: 'List available delivery jobs for drivers',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(deliveryJobListResponseSchema, 'List of available delivery jobs'),
      ...errorResponses(401, 403, 500),
    },
  }),
  requireSession,
  requireRole('driver'),
  async (c) => {
    const list = await DriverService.getAvailableJobs();
    return c.json(list);
  },
);

// Get Delivery Job Detail
driverRouter.get(
  '/jobs/:id',
  describeRoute({
    operationId: 'getDriverJobDetail',
    tags: ['Driver'],
    summary: 'Get details of a specific delivery job',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(deliveryJobResponseSchema, 'Details of the delivery job'),
      ...errorResponses(401, 403, 404, 500),
    },
  }),
  requireSession,
  requireRole('driver'),
  async (c) => {
    const jobId = c.req.param('id');
    const detail = await DriverService.getJobDetail(jobId);
    return c.json(detail);
  },
);
