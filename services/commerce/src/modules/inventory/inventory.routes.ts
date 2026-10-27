import { factory } from '@seapedia/platform/factory';
import { requireRole, requireSession } from '@seapedia/platform/auth';
import { errorResponses, jsonContent } from '@seapedia/platform/openapi';
import { describeRoute, validator } from 'hono-openapi';
import { z } from 'zod';
import { setStockSchema, stockResponseSchema } from './inventory.schemas';
import { InventoryService } from './inventory.service';

export const sellerInventoryRouter = factory.createApp();

sellerInventoryRouter.put(
  '/:productId',
  describeRoute({
    operationId: 'setSellerProductStock',
    tags: ['Seller Inventory'],
    summary: 'Set the stock of a product owned by the logged-in Seller',
    description:
      'Commerce owns stock. The catalog shows a read model of it that catches up within a few seconds.',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(stockResponseSchema, 'Stock updated'),
      202: jsonContent(stockResponseSchema, 'Product not replicated yet; stock applies when it is'),
      ...errorResponses(400, 401, 403, 404, 500),
    },
  }),
  requireSession,
  requireRole('seller'),
  validator('param', z.object({ productId: z.string().uuid() })),
  validator('json', setStockSchema),
  async (c) => {
    const userId = c.get('userId');
    const { productId } = c.req.valid('param');
    const { stock } = c.req.valid('json');
    const result = await InventoryService.setStock(userId, productId, stock);
    return c.json(result, result.pending ? 202 : 200);
  },
);
