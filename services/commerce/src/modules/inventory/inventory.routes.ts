import { factory } from '@seapedia/platform/factory';
import { requireRole, requireSession } from '@seapedia/platform/auth';
import { errorResponses, jsonContent } from '@seapedia/platform/openapi';
import { describeRoute, validator } from 'hono-openapi';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { setStockSchema, stockResponseSchema } from './inventory.schemas';
import { InventoryService } from './inventory.service';

export const sellerInventoryRouter = factory.createApp();

sellerInventoryRouter.use(requireSession);
sellerInventoryRouter.use(requireRole('seller'));

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
      ...errorResponses(400, 401, 403, 404, 500),
    },
  }),
  validator('param', z.object({ productId: z.string().uuid() })),
  validator('json', setStockSchema),
  async (c) => {
    const userId = c.get('userId');
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });

    const { productId } = c.req.valid('param');
    const { stock } = c.req.valid('json');
    return c.json(await InventoryService.setStock(userId, productId, stock));
  },
);
