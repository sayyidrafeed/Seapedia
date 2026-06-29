import { factory } from '@/lib/factory';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { requireSession, requireRole } from '@/middleware/auth';
import {
  walletResponseSchema,
  walletTransactionsListSchema,
  topUpRequestSchema,
  topUpResponseSchema,
  walletTransactionResponseSchema,
  addressListResponseSchema,
  addressRequestSchema,
  addressResponseSchema,
} from './buyers.schemas';
import { BuyersService } from './buyers.service';
import { z } from 'zod';

export const buyersRouter = factory.createApp();

// Secure all endpoints with session + buyer role checks
buyersRouter.use('*', requireSession, requireRole('buyer'));

buyersRouter.get(
  '/wallet',
  describeRoute({
    operationId: 'getBuyerWallet',
    tags: ['Buyer Wallet'],
    summary: 'Get buyer wallet balance',
    responses: {
      200: jsonContent(walletResponseSchema, 'Wallet details'),
      ...errorResponses(401, 403, 500),
    },
  }),
  async (c) => {
    const userId = c.get('userId') as string;
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
  '/wallet/topup/request',
  describeRoute({
    operationId: 'requestTopUp',
    tags: ['Buyer Wallet'],
    summary: 'Initiate a simulated top-up request',
    responses: {
      200: jsonContent(topUpResponseSchema, 'Top-up transaction initialized'),
      ...errorResponses(400, 401, 403, 500),
    },
  }),
  validator('json', topUpRequestSchema),
  async (c) => {
    const userId = c.get('userId') as string;
    const { amount, paymentMethod } = c.req.valid('json');

    const result = await BuyersService.createTopUpRequest(userId, amount, paymentMethod);

    return c.json({
      transaction: {
        id: result.transaction.id,
        walletId: result.transaction.walletId,
        amount: result.transaction.amount,
        type: result.transaction.type,
        paymentMethod: result.transaction.paymentMethod,
        status: result.transaction.status,
        reference: result.transaction.reference,
        createdAt: result.transaction.createdAt.toISOString(),
      },
      paymentInstructions: result.paymentInstructions,
    });
  },
);

buyersRouter.post(
  '/wallet/topup/:transactionId/simulate',
  describeRoute({
    operationId: 'simulateTopUp',
    tags: ['Buyer Wallet'],
    summary: 'Simulate successful payment for a top-up transaction',
    responses: {
      200: jsonContent(walletTransactionResponseSchema, 'Payment successful, wallet updated'),
      ...errorResponses(401, 403, 404, 500),
    },
  }),
  async (c) => {
    const userId = c.get('userId') as string;
    const transactionId = c.req.param('transactionId');

    const transaction = await BuyersService.simulateTopUpPayment(userId, transactionId);

    return c.json({
      id: transaction.id,
      walletId: transaction.walletId,
      amount: transaction.amount,
      type: transaction.type,
      paymentMethod: transaction.paymentMethod,
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
    responses: {
      200: jsonContent(walletTransactionsListSchema, 'List of transactions'),
      ...errorResponses(401, 403, 500),
    },
  }),
  async (c) => {
    const userId = c.get('userId') as string;
    const list = await BuyersService.getWalletTransactions(userId);

    const formatted = list.map((t) => ({
      id: t.id,
      walletId: t.walletId,
      amount: t.amount,
      type: t.type,
      paymentMethod: t.paymentMethod,
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
    responses: {
      200: jsonContent(addressListResponseSchema, 'List of addresses'),
      ...errorResponses(401, 403, 500),
    },
  }),
  async (c) => {
    const userId = c.get('userId') as string;
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
    responses: {
      201: jsonContent(addressResponseSchema, 'Address created'),
      ...errorResponses(400, 401, 403, 500),
    },
  }),
  validator('json', addressRequestSchema),
  async (c) => {
    const userId = c.get('userId') as string;
    const body = c.req.valid('json');

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
    responses: {
      200: jsonContent(addressResponseSchema, 'Address updated'),
      ...errorResponses(400, 401, 403, 404, 500),
    },
  }),
  validator('json', addressRequestSchema),
  async (c) => {
    const userId = c.get('userId') as string;
    const addressId = c.req.param('id');
    const body = c.req.valid('json');

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
    responses: {
      200: jsonContent(z.object({ success: z.boolean() }), 'Default address set'),
      ...errorResponses(401, 403, 404, 500),
    },
  }),
  async (c) => {
    const userId = c.get('userId') as string;
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
    responses: {
      200: jsonContent(z.object({ success: z.boolean() }), 'Address deleted'),
      ...errorResponses(401, 403, 404, 500),
    },
  }),
  async (c) => {
    const userId = c.get('userId') as string;
    const addressId = c.req.param('id');

    const result = await BuyersService.deleteAddress(userId, addressId);

    return c.json(result);
  },
);
