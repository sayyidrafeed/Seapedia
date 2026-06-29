import { factory } from '@/lib/factory';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { productSchema, productListResponseSchema } from './products.schemas';
import { z } from 'zod';
import { paginationQuerySchema } from '@/lib/schemas';
import { ProductsService } from './products.service';

export const productsRouter = factory.createApp();

const productQuerySchema = paginationQuerySchema.extend({
  storeSlug: z.string().optional(),
});

productsRouter.get(
  '/',
  describeRoute({
    operationId: 'listProducts',
    tags: ['Products'],
    summary: 'List products (public)',
    responses: {
      200: jsonContent(productListResponseSchema, 'Products list'),
      ...errorResponses(400, 500),
    },
  }),
  validator('query', productQuerySchema),
  async (c) => {
    const { search, storeSlug } = c.req.valid('query');
    const results = await ProductsService.getPublicProducts(search, storeSlug);

    return c.json({
      products: results,
      total: results.length,
    });
  },
);

productsRouter.get(
  '/:id',
  describeRoute({
    operationId: 'getProductById',
    tags: ['Products'],
    summary: 'Get product details (public)',
    responses: {
      200: jsonContent(productSchema, 'Product details'),
      ...errorResponses(404, 500),
    },
  }),
  validator('param', z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid('param');
    const product = await ProductsService.getPublicProductById(id);
    return c.json(product);
  },
);

productsRouter.get(
  '/by-slug/:storeSlug/:productSlug',
  describeRoute({
    operationId: 'getProductBySlug',
    tags: ['Products'],
    summary: 'Get product by store and product slug (public)',
    responses: {
      200: jsonContent(productSchema, 'Product details'),
      ...errorResponses(404, 500),
    },
  }),
  validator('param', z.object({ storeSlug: z.string(), productSlug: z.string() })),
  async (c) => {
    const { storeSlug, productSlug } = c.req.valid('param');
    const product = await ProductsService.getPublicProductBySlug(storeSlug, productSlug);
    return c.json(product);
  },
);
