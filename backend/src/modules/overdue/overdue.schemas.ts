import { z } from '@hono/zod-openapi';

export const simulateDayResponseSchema = z
  .object({
    dayOffset: z.number().int().openapi({ description: 'Updated simulation day offset' }),
    message: z.string().openapi({ description: 'Status message' }),
  })
  .openapi('SimulateDayResponse');

export const processOverdueResponseSchema = z
  .object({
    processedCount: z.number().int().openapi({ description: 'Number of orders processed' }),
    details: z
      .array(
        z.object({
          orderId: z.string().openapi({ description: 'Order ID' }),
          status: z.string().openapi({ description: 'New status' }),
          refundAmount: z.number().int().openapi({ description: 'Amount refunded to buyer wallet' }),
          stockRestored: z
            .boolean()
            .openapi({ description: 'Whether product stock was restored' }),
        }),
      )
      .openapi({ description: 'Details of processed orders' }),
  })
  .openapi('ProcessOverdueResponse');
