import { factory } from '@/lib/factory';
import { requireRole, requireSession } from '@/middleware/auth';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { createStoreSchema, storeResponseSchema, updateStoreSchema } from './stores.schemas';
import { StoreService } from './stores.service';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';

export const storesRouter = factory.createApp();

storesRouter.post(
  '/',
  describeRoute({
    operationId: 'createStore',
    tags: ['Stores'],
    summary: 'Create a new store',
    description: 'Create a new store for the currently authenticated seller.',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(storeResponseSchema, 'Store created successfully'),
      ...errorResponses(400, 401, 409),
    },
  }),
  requireSession,
  requireRole('seller'),
  validator('json', createStoreSchema),
  async (c) => {
    const userId = c.get('userId');
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });

    const body = c.req.valid('json');
    const store = await StoreService.create(userId, body);

    return c.json({
      id: store.id,
      sellerId: store.sellerId,
      name: store.name,
      description: store.description,
      createdAt: store.createdAt.toISOString(),
      updatedAt: store.updatedAt.toISOString(),
    });
  },
);

storesRouter.get(
  '/me',
  describeRoute({
    operationId: 'getCurrentSellerStore',
    tags: ['Stores'],
    summary: 'Get current seller store',
    description: 'Get the store of the currently authenticated seller.',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(storeResponseSchema, 'Store found'),
      ...errorResponses(401, 404),
    },
  }),
  requireSession,
  requireRole('seller'),
  async (c) => {
    const userId = c.get('userId');
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });

    const store = await StoreService.getBySellerId(userId);

    return c.json({
      id: store.id,
      sellerId: store.sellerId,
      name: store.name,
      description: store.description,
      createdAt: store.createdAt.toISOString(),
      updatedAt: store.updatedAt.toISOString(),
    });
  },
);

storesRouter.put(
  '/me',
  describeRoute({
    operationId: 'updateCurrentSellerStore',
    tags: ['Stores'],
    summary: 'Update current seller store',
    description: 'Update the store of the currently authenticated seller.',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(storeResponseSchema, 'Store updated successfully'),
      ...errorResponses(400, 401, 404, 409),
    },
  }),
  requireSession,
  requireRole('seller'),
  validator('json', updateStoreSchema),
  async (c) => {
    const userId = c.get('userId');
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });

    const body = c.req.valid('json');
    const store = await StoreService.update(userId, body);

    return c.json({
      id: store.id,
      sellerId: store.sellerId,
      name: store.name,
      description: store.description,
      createdAt: store.createdAt.toISOString(),
      updatedAt: store.updatedAt.toISOString(),
    });
  },
);

storesRouter.get(
  '/public/:slugOrId',
  describeRoute({
    operationId: 'getPublicStoreInfo',
    tags: ['Stores'],
    summary: 'Get public store info',
    description: 'Get public information about a store by ID or slug (name).',
    responses: {
      200: jsonContent(storeResponseSchema, 'Store found'),
      ...errorResponses(404),
    },
  }),
  validator('param', z.object({ slugOrId: z.string().min(3) })),
  async (c) => {
    const { slugOrId } = c.req.valid('param');
    const store = await StoreService.getPublic(slugOrId);

    return c.json({
      id: store.id,
      sellerId: store.sellerId,
      name: store.name,
      description: store.description,
      createdAt: store.createdAt.toISOString(),
      updatedAt: store.updatedAt.toISOString(),
    });
  },
);
