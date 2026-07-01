import { factory } from '@/lib/factory';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { HTTPException } from 'hono/http-exception';
import { productSchema, productListResponseSchema } from './products.schemas';
import { z } from 'zod';
import { paginationQuerySchema } from '@/lib/schemas';
import { ProductsService } from './products.service';
import { requireRole, requireSession } from '@/middleware/auth';
import { StorageService } from '@/lib/storage';
import { presignRequestSchema, presignResponseSchema } from '@/lib/upload.schemas';

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
    const { search, storeSlug, page, limit } = c.req.valid('query');
    const { products: results, total } = await ProductsService.getPublicProducts({
      search,
      storeSlug,
      page,
      limit,
    });

    const formatted = results.map((p) => ({
      ...p,
      imageUrl: p.imageKey ? StorageService.getPublicUrl(p.imageKey) : null,
      storeLogoUrl: p.storeLogoKey ? StorageService.getPublicUrl(p.storeLogoKey) : null,
    }));

    return c.json({
      products: formatted,
      total,
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
    return c.json({
      ...product,
      imageUrl: product.imageKey ? StorageService.getPublicUrl(product.imageKey) : null,
      storeLogoUrl: product.storeLogoKey ? StorageService.getPublicUrl(product.storeLogoKey) : null,
    });
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
    return c.json({
      ...product,
      imageUrl: product.imageKey ? StorageService.getPublicUrl(product.imageKey) : null,
      storeLogoUrl: product.storeLogoKey ? StorageService.getPublicUrl(product.storeLogoKey) : null,
    });
  },
);

productsRouter.post(
  '/image/presign',
  describeRoute({
    operationId: 'presignProductImage',
    tags: ['Products'],
    summary: 'Generate pre-signed URL for product image upload',
    description:
      'Generates an expiring pre-signed URL for direct upload of a product image to Cloudflare R2.',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(presignResponseSchema, 'Presigned URL generated successfully'),
      ...errorResponses(400, 401, 403, 500),
    },
  }),
  requireSession,
  requireRole('seller'),
  validator('json', presignRequestSchema),
  async (c) => {
    const userId = c.get('userId');
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });

    const { mimeType } = c.req.valid('json');
    const result = await ProductsService.presignImage(userId, mimeType);

    return c.json(result);
  },
);
