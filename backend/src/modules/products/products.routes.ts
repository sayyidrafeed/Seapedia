import { factory } from '@/lib/factory';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { productSchema, productListResponseSchema } from './products.schemas';
import { z } from 'zod';
import { paginationQuerySchema } from '@/lib/schemas';
import { NotFoundError } from '@/lib/errors';

export const productsRouter = factory.createApp();

const MOCK_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Exotic Sea Sponge',
    description: 'Natural organic sea sponge harvested sustainably from the Mediterranean.',
    price: 159_900,
    currency: 'IDR',
    stock: 45,
    storeName: 'Sponge Emporium',
    storeSlug: 'sponge-emporium',
    slug: 'exotic-sea-sponge-a1b2c3d4',
  },
  {
    id: 'prod-2',
    name: 'Blue Ocean Coral Decor',
    description: 'Beautiful replica coral decor for saltwater aquariums and home styling.',
    price: 299_900,
    currency: 'IDR',
    stock: 12,
    storeName: 'Reef Wonders',
    storeSlug: 'reef-wonders',
    slug: 'blue-ocean-coral-decor-b2c3d4e5',
  },
  {
    id: 'prod-3',
    name: 'Premium Aquascaping Sand',
    description: 'Fine grain natural sand perfect for fresh or saltwater aquariums.',
    price: 99_900,
    currency: 'IDR',
    stock: 150,
    storeName: 'Aquatic Substrates',
    storeSlug: 'aquatic-substrates',
    slug: 'premium-aquascaping-sand-c3d4e5f6',
  },
];

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
  validator('query', paginationQuerySchema),
  async (c) => {
    const { search } = c.req.valid('query');
    let filtered = MOCK_PRODUCTS;

    if (search) {
      const lower = search.toLowerCase();
      filtered = MOCK_PRODUCTS.filter(
        (p) => p.name.toLowerCase().includes(lower) || p.description.toLowerCase().includes(lower),
      );
    }

    return c.json({
      products: filtered,
      total: filtered.length,
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
    const product = MOCK_PRODUCTS.find((p) => p.id === id);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

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
    const product = MOCK_PRODUCTS.find(
      (p) => p.storeSlug.toLowerCase() === storeSlug.toLowerCase() && p.slug.toLowerCase() === productSlug.toLowerCase(),
    );

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return c.json(product);
  },
);
