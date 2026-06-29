import { factory } from '@/lib/factory';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { requireSession, requireRole } from '@/middleware/auth';
import {
  checkoutPreviewRequestSchema,
  checkoutPreviewResponseSchema,
  createOrderRequestSchema,
  orderResponseSchema,
  orderListResponseSchema,
  orderDetailResponseSchema,
} from './orders-schemas';
import { OrdersCheckoutService } from './orders-checkout.service';
import { OrdersBuyerService } from './orders-buyer.service';
import { OrdersSellerService } from './orders-seller.service';

export const ordersRouter = factory.createApp();
export const sellerOrdersRouter = factory.createApp();

// Buyer: Checkout Preview
ordersRouter.post(
  '/preview',
  describeRoute({
    operationId: 'checkoutPreview',
    tags: ['Orders'],
    summary: 'Preview order calculations before checking out',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(checkoutPreviewResponseSchema, 'Calculated checkout totals'),
      ...errorResponses(400, 401, 403, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  validator('json', checkoutPreviewRequestSchema),
  async (c) => {
    const userId = c.get('userId') as string;
    const { deliveryMethod } = c.req.valid('json');

    const result = await OrdersCheckoutService.preview(userId, deliveryMethod);
    return c.json(result);
  },
);

// Buyer: Confirm Order
ordersRouter.post(
  '/',
  describeRoute({
    operationId: 'createOrder',
    tags: ['Orders'],
    summary: 'Confirm checkout and create a new order',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(orderResponseSchema, 'Order successfully created'),
      ...errorResponses(400, 401, 403, 404, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  validator('json', createOrderRequestSchema),
  async (c) => {
    const userId = c.get('userId') as string;
    const { deliveryMethod, addressId } = c.req.valid('json');

    const order = await OrdersCheckoutService.createOrder(userId, deliveryMethod, addressId);
    const detail = await OrdersBuyerService.getDetail(userId, order.id);
    return c.json(detail);
  },
);

// Buyer: List Orders
ordersRouter.get(
  '/',
  describeRoute({
    operationId: 'listBuyerOrders',
    tags: ['Orders'],
    summary: 'List buyer orders',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(orderListResponseSchema, 'List of buyer orders'),
      ...errorResponses(401, 403, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  async (c) => {
    const userId = c.get('userId') as string;
    const list = await OrdersBuyerService.list(userId);
    return c.json(list);
  },
);

// Buyer: Get Order Detail
ordersRouter.get(
  '/:id',
  describeRoute({
    operationId: 'getBuyerOrderDetail',
    tags: ['Orders'],
    summary: 'Get details of a specific buyer order',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(orderDetailResponseSchema, 'Buyer order details'),
      ...errorResponses(401, 403, 404, 500),
    },
  }),
  requireSession,
  requireRole('buyer'),
  async (c) => {
    const userId = c.get('userId') as string;
    const orderId = c.req.param('id');

    const detail = await OrdersBuyerService.getDetail(userId, orderId);
    return c.json(detail);
  },
);

// Seller: List Incoming Orders
sellerOrdersRouter.get(
  '/',
  describeRoute({
    operationId: 'listSellerOrders',
    tags: ['Seller Orders'],
    summary: 'List orders incoming to the seller store',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(orderListResponseSchema, 'List of seller store orders'),
      ...errorResponses(401, 403, 500),
    },
  }),
  requireSession,
  requireRole('seller'),
  async (c) => {
    const userId = c.get('userId') as string;
    const list = await OrdersSellerService.list(userId);
    return c.json(list);
  },
);

// Seller: Get Incoming Order Detail
sellerOrdersRouter.get(
  '/:id',
  describeRoute({
    operationId: 'getSellerOrderDetail',
    tags: ['Seller Orders'],
    summary: 'Get details of a specific incoming order',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(orderDetailResponseSchema, 'Seller incoming order details'),
      ...errorResponses(401, 403, 404, 500),
    },
  }),
  requireSession,
  requireRole('seller'),
  async (c) => {
    const userId = c.get('userId') as string;
    const orderId = c.req.param('id');

    const detail = await OrdersSellerService.getDetail(userId, orderId);
    return c.json(detail);
  },
);
