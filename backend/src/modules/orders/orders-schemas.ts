import { z } from 'zod';
import { addressResponseSchema } from '@/modules/buyers/buyers.schemas';

export const checkoutPreviewRequestSchema = z
  .object({
    deliveryMethod: z.enum(['instant', 'next_day', 'regular']),
    discountCode: z.string().optional(),
  })
  .meta({ id: 'CheckoutPreviewRequest' });

export const checkoutPreviewItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.number().int(),
  quantity: z.number().int(),
  total: z.number().int(),
});

export const checkoutPreviewResponseSchema = z
  .object({
    items: z.array(checkoutPreviewItemSchema),
    subtotal: z.number().int(),
    discountAmount: z.number().int(),
    discountCode: z.string().nullable(),
    discountType: z.string().nullable(),
    deliveryFee: z.number().int(),
    taxBase: z.number().int(),
    ppn: z.number().int(),
    totalAmount: z.number().int(),
    deliveryMethod: z.string(),
    address: addressResponseSchema.nullable(),
    storeId: z.string().nullable(),
    storeName: z.string().nullable(),
  })
  .meta({ id: 'CheckoutPreviewResponse' });

export const createOrderRequestSchema = z
  .object({
    deliveryMethod: z.enum(['instant', 'next_day', 'regular']),
    addressId: z.string().uuid('Invalid address ID format'),
    discountCode: z.string().optional(),
  })
  .meta({ id: 'CreateOrderRequest' });

export const orderItemResponseSchema = z.object({
  id: z.string(),
  productId: z.string().nullable(),
  productName: z.string(),
  productPrice: z.number().int(),
  quantity: z.number().int(),
});

export const orderStatusHistoryResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  note: z.string().nullable(),
  createdAt: z.string(),
});

export const orderResponseSchema = z
  .object({
    id: z.string(),
    buyerId: z.string(),
    storeId: z.string(),
    storeName: z.string(),
    deliveryMethod: z.string(),
    subtotal: z.number().int(),
    discountAmount: z.number().int(),
    discountCode: z.string().nullable(),
    discountType: z.string().nullable(),
    deliveryFee: z.number().int(),
    ppn: z.number().int(),
    totalAmount: z.number().int(),
    status: z.string(),
    addressSnapshot: addressResponseSchema, // Parsed address JSON object
    createdAt: z.string(),
    updatedAt: z.string(),
    items: z.array(orderItemResponseSchema),
    statusHistory: z.array(orderStatusHistoryResponseSchema).optional(),
  })
  .meta({ id: 'OrderResponse' });

export const orderListResponseSchema = z
  .array(orderResponseSchema)
  .meta({ id: 'OrderListResponse' });

export const orderDetailResponseSchema = orderResponseSchema.meta({ id: 'OrderDetailResponse' });

export const processOrderRequestSchema = z
  .object({
    note: z.string().max(1000, 'Note must not exceed 1000 characters').optional(),
  })
  .meta({ id: 'ProcessOrderRequest' });

export const buyerReportResponseSchema = z
  .object({
    totalSpending: z.number().int(),
    totalOrders: z.number().int(),
    averageOrderValue: z.number().int(),
    orders: z.array(orderResponseSchema),
  })
  .meta({ id: 'BuyerReportResponse' });

export const sellerReportResponseSchema = z
  .object({
    totalIncome: z.number().int(),
    totalOrders: z.number().int(),
    averageRevenue: z.number().int(),
    orders: z.array(orderResponseSchema),
  })
  .meta({ id: 'SellerReportResponse' });
