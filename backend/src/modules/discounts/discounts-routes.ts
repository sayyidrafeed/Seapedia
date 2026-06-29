import { factory } from '@/lib/factory';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { requireSession, requireRole } from '@/middleware/auth';
import {
  createVoucherRequestSchema,
  createPromoRequestSchema,
  voucherResponseSchema,
  promoResponseSchema,
  voucherListResponseSchema,
  promoListResponseSchema,
  validateDiscountRequestSchema,
  validateDiscountResponseSchema,
} from './discounts-schemas';
import { DiscountsService } from './discounts.service';

export const discountsAdminRouter = factory.createApp();
export const discountsBuyerRouter = factory.createApp();

// VOUCHERS

discountsAdminRouter.post(
  '/vouchers',
  describeRoute({
    operationId: 'createVoucher',
    tags: ['Admin Discounts'],
    summary: 'Create a new discount voucher',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(voucherResponseSchema, 'Voucher created successfully'),
      ...errorResponses(400, 401, 403, 500),
    },
  }),
  requireSession,
  requireRole('admin'),
  validator('json', createVoucherRequestSchema),
  async (c) => {
    const data = c.req.valid('json');
    const created = await DiscountsService.createVoucher({
      ...data,
      expiresAt: new Date(data.expiresAt),
    });

    return c.json({
      ...created,
      expiresAt: created.expiresAt.toISOString(),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    });
  },
);

discountsAdminRouter.get(
  '/vouchers',
  describeRoute({
    operationId: 'listVouchers',
    tags: ['Admin Discounts'],
    summary: 'List all discount vouchers',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(voucherListResponseSchema, 'List of vouchers'),
      ...errorResponses(401, 403, 500),
    },
  }),
  requireSession,
  requireRole('admin'),
  async (c) => {
    const list = await DiscountsService.listVouchers();
    return c.json(
      list.map((v) => ({
        ...v,
        expiresAt: v.expiresAt.toISOString(),
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      })),
    );
  },
);

discountsAdminRouter.get(
  '/vouchers/:id',
  describeRoute({
    operationId: 'getVoucher',
    tags: ['Admin Discounts'],
    summary: 'Get details of a specific voucher',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(voucherResponseSchema, 'Voucher details'),
      ...errorResponses(401, 403, 404, 500),
    },
  }),
  requireSession,
  requireRole('admin'),
  async (c) => {
    const id = c.req.param('id');
    const voucher = await DiscountsService.getVoucher(id);
    return c.json({
      ...voucher,
      expiresAt: voucher.expiresAt.toISOString(),
      createdAt: voucher.createdAt.toISOString(),
      updatedAt: voucher.updatedAt.toISOString(),
    });
  },
);

// PROMOS

discountsAdminRouter.post(
  '/promos',
  describeRoute({
    operationId: 'createPromo',
    tags: ['Admin Discounts'],
    summary: 'Create a new discount promo campaign',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(promoResponseSchema, 'Promo created successfully'),
      ...errorResponses(400, 401, 403, 500),
    },
  }),
  requireSession,
  requireRole('admin'),
  validator('json', createPromoRequestSchema),
  async (c) => {
    const data = c.req.valid('json');
    const created = await DiscountsService.createPromo({
      ...data,
      expiresAt: new Date(data.expiresAt),
    });

    return c.json({
      ...created,
      expiresAt: created.expiresAt.toISOString(),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    });
  },
);

discountsAdminRouter.get(
  '/promos',
  describeRoute({
    operationId: 'listPromos',
    tags: ['Admin Discounts'],
    summary: 'List all discount promos',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(promoListResponseSchema, 'List of promos'),
      ...errorResponses(401, 403, 500),
    },
  }),
  requireSession,
  requireRole('admin'),
  async (c) => {
    const list = await DiscountsService.listPromos();
    return c.json(
      list.map((p) => ({
        ...p,
        expiresAt: p.expiresAt.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    );
  },
);

discountsAdminRouter.get(
  '/promos/:id',
  describeRoute({
    operationId: 'getPromo',
    tags: ['Admin Discounts'],
    summary: 'Get details of a specific promo campaign',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(promoResponseSchema, 'Promo details'),
      ...errorResponses(401, 403, 404, 500),
    },
  }),
  requireSession,
  requireRole('admin'),
  async (c) => {
    const id = c.req.param('id');
    const promo = await DiscountsService.getPromo(id);
    return c.json({
      ...promo,
      expiresAt: promo.expiresAt.toISOString(),
      createdAt: promo.createdAt.toISOString(),
      updatedAt: promo.updatedAt.toISOString(),
    });
  },
);

// BUYER VALIDATION

discountsBuyerRouter.post(
  '/validate',
  describeRoute({
    operationId: 'validateDiscountCode',
    tags: ['Discounts'],
    summary: 'Validate a voucher or promo code for buyer checkout',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(validateDiscountResponseSchema, 'Discount code validation result'),
      ...errorResponses(400, 401, 403, 404, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  validator('json', validateDiscountRequestSchema),
  async (c) => {
    const { code, subtotal } = c.req.valid('json');
    const result = await DiscountsService.validateCode(code, subtotal);
    return c.json({
      type: result.type,
      code: result.code,
      discountAmount: result.discountAmount,
      description: result.description,
    });
  },
);
