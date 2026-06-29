import { factory } from '@/lib/factory';
import { requireRole, requireSession } from '@/middleware/auth';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import {
  createProductSchema,
  updateProductSchema,
  sellerProductResponseSchema,
  sellerProductListResponseSchema,
} from './products.schemas';
import { ProductsService } from './products.service';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';

export const sellerProductsRouter = factory.createApp();

sellerProductsRouter.use(requireSession);
sellerProductsRouter.use(requireRole('seller'));

sellerProductsRouter.get(
  '/',
  describeRoute({
    operationId: 'listSellerProducts',
    tags: ['Seller Products'],
    summary: 'List products owned by logged-in Seller',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(sellerProductListResponseSchema, 'Products list'),
      ...errorResponses(401, 403, 500),
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });

    const products = await ProductsService.getSellerProducts(userId);
    const formatted = products.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return c.json({
      products: formatted,
      total: formatted.length,
    });
  },
);

sellerProductsRouter.post(
  '/',
  describeRoute({
    operationId: 'createSellerProduct',
    tags: ['Seller Products'],
    summary: 'Create a new product under Seller store',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(sellerProductResponseSchema, 'Product created successfully'),
      ...errorResponses(400, 401, 403, 500),
    },
  }),
  validator('json', createProductSchema),
  async (c) => {
    const userId = c.get('userId');
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });

    const body = c.req.valid('json');
    const product = await ProductsService.createSellerProduct(userId, body);

    return c.json({
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    });
  },
);

sellerProductsRouter.put(
  '/:id',
  describeRoute({
    operationId: 'updateSellerProduct',
    tags: ['Seller Products'],
    summary: 'Update a product owned by Seller',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(sellerProductResponseSchema, 'Product updated successfully'),
      ...errorResponses(400, 401, 403, 404, 500),
    },
  }),
  validator('param', z.object({ id: z.string().uuid() })),
  validator('json', updateProductSchema),
  async (c) => {
    const userId = c.get('userId');
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });

    const { id } = c.req.valid('param');
    const body = c.req.valid('json');

    const product = await ProductsService.updateSellerProduct(userId, id, body);

    return c.json({
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    });
  },
);

sellerProductsRouter.delete(
  '/:id',
  describeRoute({
    operationId: 'deleteSellerProduct',
    tags: ['Seller Products'],
    summary: 'Delete a product owned by Seller',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(z.object({ success: z.boolean() }), 'Product deleted successfully'),
      ...errorResponses(401, 403, 404, 500),
    },
  }),
  validator('param', z.object({ id: z.string().uuid() })),
  async (c) => {
    const userId = c.get('userId');
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });

    const { id } = c.req.valid('param');
    await ProductsService.deleteSellerProduct(userId, id);

    return c.json({ success: true });
  },
);
