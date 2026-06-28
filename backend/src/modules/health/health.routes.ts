import { describeRoute } from 'hono-openapi';
import { factory } from '@/lib/factory';
import { successSchema } from '@/lib/schemas';
import { jsonContent } from '@/lib/openapi';

export const healthRouter = factory.createApp();

healthRouter.get(
  '/',
  describeRoute({
    operationId: 'healthCheck',
    tags: ['Health'],
    summary: 'Health check',
    responses: {
      200: jsonContent(successSchema, 'Service is healthy'),
    },
  }),
  (c) => c.json({ success: true as const }),
);
