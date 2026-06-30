import { factory } from '@/lib/factory';
import { describeRoute, validator } from 'hono-openapi';
import { z } from 'zod';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { requireSession, requireRole } from '@/middleware/auth';
import {
  deliveryJobListResponseSchema,
  deliveryJobResponseSchema,
  driverActionSuccessResponseSchema,
  driverStatsResponseSchema,
} from './driver.schemas';
import { DriverService } from './driver.service';

export const driverRouter = factory.createApp();

// Get Driver Dashboard Stats
driverRouter.get(
  '/me/stats',
  describeRoute({
    operationId: 'getDriverStats',
    tags: ['Driver'],
    summary: 'Get stats, earnings and jobs history for the logged-in driver',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(driverStatsResponseSchema, 'Driver statistics and jobs history'),
      ...errorResponses(401, 403, 500),
    },
  }),
  requireSession,
  requireRole('driver'),
  async (c) => {
    const userId = c.get('userId') as string;
    const stats = await DriverService.getDriverStats(userId);
    return c.json(stats);
  },
);

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
  validator('param', z.object({ id: z.string().uuid() })),
  async (c) => {
    const { id } = c.req.valid('param');
    const detail = await DriverService.getJobDetail(id);
    return c.json(detail);
  },
);

// Take Job Action
driverRouter.post(
  '/jobs/:id/take',
  describeRoute({
    operationId: 'takeDeliveryJob',
    tags: ['Driver'],
    summary: 'Take a pending delivery job',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(driverActionSuccessResponseSchema, 'Job taken successfully'),
      ...errorResponses(401, 403, 404, 409, 500),
    },
  }),
  requireSession,
  requireRole('driver'),
  validator('param', z.object({ id: z.string().uuid() })),
  async (c) => {
    const { id } = c.req.valid('param');
    const userId = c.get('userId') as string;
    const result = await DriverService.takeJob(id, userId);
    return c.json(result);
  },
);

// Complete Job Action
driverRouter.post(
  '/jobs/:id/complete',
  describeRoute({
    operationId: 'completeDeliveryJob',
    tags: ['Driver'],
    summary: 'Complete a taken delivery job',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(driverActionSuccessResponseSchema, 'Job completed successfully'),
      ...errorResponses(401, 403, 404, 409, 500),
    },
  }),
  requireSession,
  requireRole('driver'),
  validator('param', z.object({ id: z.string().uuid() })),
  async (c) => {
    const { id } = c.req.valid('param');
    const userId = c.get('userId') as string;
    const result = await DriverService.completeJob(id, userId);
    return c.json(result);
  },
);
