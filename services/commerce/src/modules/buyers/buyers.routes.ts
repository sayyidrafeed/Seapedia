import { factory } from '@seapedia/platform/factory';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@seapedia/platform/openapi';
import { requireSession, requireRole } from '@seapedia/platform/auth';
import {
  walletResponseSchema,
  walletTransactionsListSchema,
  topUpRequestSchema,
  walletTransactionResponseSchema,
  addressListResponseSchema,
  addressRequestSchema,
  addressResponseSchema,
} from './buyers.schemas';
import {
  cartItemRequestSchema,
  updateCartItemRequestSchema,
  cartSummaryResponseSchema,
} from './buyers-cart.schemas';
import { BuyersService } from './buyers.service';
import { BuyersCartService } from './buyers-cart.service';
import { z } from 'zod';
import { LocationsProvider } from '@/modules/locations/locations.index';
import { ValidationError } from '@seapedia/platform/errors';

export const buyersRouter = factory.createApp();

buyersRouter.get(
  '/wallet',
  describeRoute({
    operationId: 'getBuyerWallet',
    tags: ['Buyer Wallet'],
    summary: 'Get buyer wallet balance',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(walletResponseSchema, 'Wallet details'),
      ...errorResponses(401, 403, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  async (c) => {
    const userId = c.get('userId');
    const wallet = await BuyersService.getOrCreateWallet(userId);

    return c.json({
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance,
      createdAt: wallet.createdAt.toISOString(),
      updatedAt: wallet.updatedAt.toISOString(),
    });
  },
);

buyersRouter.post(
  '/wallet/topup',
  describeRoute({
    operationId: 'topUpWallet',
    tags: ['Buyer Wallet'],
    summary: 'Directly top up the wallet balance',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(walletTransactionResponseSchema, 'Wallet topped up successfully'),
      ...errorResponses(400, 401, 403, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  validator('json', topUpRequestSchema),
  async (c) => {
    const userId = c.get('userId');
    const { amount } = c.req.valid('json');

    const transaction = await BuyersService.directTopUp(userId, amount);

    return c.json({
      id: transaction.id,
      walletId: transaction.walletId,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
      reference: transaction.reference,
      createdAt: transaction.createdAt.toISOString(),
    });
  },
);

buyersRouter.get(
  '/wallet/transactions',
  describeRoute({
    operationId: 'getWalletTransactions',
    tags: ['Buyer Wallet'],
    summary: 'Get wallet transaction history',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(walletTransactionsListSchema, 'List of transactions'),
      ...errorResponses(401, 403, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  async (c) => {
    const userId = c.get('userId');
    const list = await BuyersService.getWalletTransactions(userId);

    const formatted = list.map((t) => ({
      id: t.id,
      walletId: t.walletId,
      amount: t.amount,
      type: t.type,
      status: t.status,
      reference: t.reference,
      createdAt: t.createdAt.toISOString(),
    }));

    return c.json(formatted);
  },
);

buyersRouter.get(
  '/addresses',
  describeRoute({
    operationId: 'getAddresses',
    tags: ['Buyer Addresses'],
    summary: 'List buyer delivery addresses',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(addressListResponseSchema, 'List of addresses'),
      ...errorResponses(401, 403, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  async (c) => {
    const userId = c.get('userId');
    const list = await BuyersService.getAddresses(userId);

    const formatted = list.map((a) => ({
      id: a.id,
      userId: a.userId,
      label: a.label,
      recipientName: a.recipientName,
      phoneNumber: a.phoneNumber,
      province: a.province,
      city: a.city,
      district: a.district,
      postalCode: a.postalCode,
      fullAddress: a.fullAddress,
      isDefault: a.isDefault,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    return c.json(formatted);
  },
);

buyersRouter.post(
  '/addresses',
  describeRoute({
    operationId: 'createAddress',
    tags: ['Buyer Addresses'],
    summary: 'Add a new delivery address',
    security: [{ cookieAuth: [] }],
    responses: {
      201: jsonContent(addressResponseSchema, 'Address created'),
      ...errorResponses(400, 401, 403, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  validator('json', addressRequestSchema),
  async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json');

    const isValid = await LocationsProvider.validateHierarchy(
      body.province,
      body.city,
      body.district,
    );
    if (!isValid) {
      throw new ValidationError('Wilayah administrasi tidak valid');
    }

    const address = await BuyersService.createAddress(userId, body);

    c.status(201);
    return c.json({
      id: address.id,
      userId: address.userId,
      label: address.label,
      recipientName: address.recipientName,
      phoneNumber: address.phoneNumber,
      province: address.province,
      city: address.city,
      district: address.district,
      postalCode: address.postalCode,
      fullAddress: address.fullAddress,
      isDefault: address.isDefault,
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt.toISOString(),
    });
  },
);

buyersRouter.put(
  '/addresses/:id',
  describeRoute({
    operationId: 'updateAddress',
    tags: ['Buyer Addresses'],
    summary: 'Update delivery address details',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(addressResponseSchema, 'Address updated'),
      ...errorResponses(400, 401, 403, 404, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  validator('json', addressRequestSchema),
  async (c) => {
    const userId = c.get('userId');
    const addressId = c.req.param('id');
    const body = c.req.valid('json');

    const isValid = await LocationsProvider.validateHierarchy(
      body.province,
      body.city,
      body.district,
    );
    if (!isValid) {
      throw new ValidationError('Wilayah administrasi tidak valid');
    }

    const address = await BuyersService.updateAddress(userId, addressId, body);

    return c.json({
      id: address.id,
      userId: address.userId,
      label: address.label,
      recipientName: address.recipientName,
      phoneNumber: address.phoneNumber,
      province: address.province,
      city: address.city,
      district: address.district,
      postalCode: address.postalCode,
      fullAddress: address.fullAddress,
      isDefault: address.isDefault,
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt.toISOString(),
    });
  },
);

buyersRouter.put(
  '/addresses/:id/default',
  describeRoute({
    operationId: 'setDefaultAddress',
    tags: ['Buyer Addresses'],
    summary: 'Set address as the default delivery address',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(z.object({ success: z.boolean() }), 'Default address set'),
      ...errorResponses(401, 403, 404, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  async (c) => {
    const userId = c.get('userId');
    const addressId = c.req.param('id');

    const result = await BuyersService.setDefaultAddress(userId, addressId);

    return c.json(result);
  },
);

buyersRouter.delete(
  '/addresses/:id',
  describeRoute({
    operationId: 'deleteAddress',
    tags: ['Buyer Addresses'],
    summary: 'Delete a delivery address',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(z.object({ success: z.boolean() }), 'Address deleted'),
      ...errorResponses(401, 403, 404, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  async (c) => {
    const userId = c.get('userId');
    const addressId = c.req.param('id');

    const result = await BuyersService.deleteAddress(userId, addressId);

    return c.json(result);
  },
);

buyersRouter.get(
  '/cart',
  describeRoute({
    operationId: 'getBuyerCart',
    tags: ['Buyer Cart'],
    summary: 'Get buyer cart summary',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(cartSummaryResponseSchema, 'Cart summary details'),
      ...errorResponses(401, 403, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  async (c) => {
    const userId = c.get('userId');
    const summary = await BuyersCartService.getCartSummary(userId);
    return c.json(summary);
  },
);

buyersRouter.post(
  '/cart/items',
  describeRoute({
    operationId: 'addCartItem',
    tags: ['Buyer Cart'],
    summary: 'Add an item to the buyer cart',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(
        z.object({ id: z.string(), productId: z.string(), quantity: z.number().int() }),
        'Item added/updated successfully',
      ),
      ...errorResponses(400, 401, 403, 409, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  validator('json', cartItemRequestSchema),
  async (c) => {
    const userId = c.get('userId');
    const { productId, quantity } = c.req.valid('json');
    const item = await BuyersCartService.addItemToCart(userId, productId, quantity);
    return c.json({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
    });
  },
);

buyersRouter.put(
  '/cart/items/:id',
  describeRoute({
    operationId: 'updateCartItem',
    tags: ['Buyer Cart'],
    summary: 'Update quantity of an item in the buyer cart',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(
        z.object({ id: z.string(), productId: z.string(), quantity: z.number().int() }),
        'Item quantity updated successfully',
      ),
      ...errorResponses(400, 401, 403, 404, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  validator('json', updateCartItemRequestSchema),
  async (c) => {
    const userId = c.get('userId');
    const cartItemId = c.req.param('id');
    const { quantity } = c.req.valid('json');
    const item = await BuyersCartService.updateCartItemQuantity(userId, cartItemId, quantity);
    return c.json({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
    });
  },
);

buyersRouter.delete(
  '/cart/items/:id',
  describeRoute({
    operationId: 'deleteCartItem',
    tags: ['Buyer Cart'],
    summary: 'Delete an item from the buyer cart',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(z.object({ success: z.boolean() }), 'Item deleted successfully'),
      ...errorResponses(401, 403, 404, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  async (c) => {
    const userId = c.get('userId');
    const cartItemId = c.req.param('id');
    const result = await BuyersCartService.removeCartItem(userId, cartItemId);
    return c.json(result);
  },
);

buyersRouter.delete(
  '/cart',
  describeRoute({
    operationId: 'clearCart',
    tags: ['Buyer Cart'],
    summary: 'Clear all items from the buyer cart',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(z.object({ success: z.boolean() }), 'Cart cleared successfully'),
      ...errorResponses(401, 403, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  async (c) => {
    const userId = c.get('userId');
    const result = await BuyersCartService.clearCart(userId);
    return c.json(result);
  },
);
