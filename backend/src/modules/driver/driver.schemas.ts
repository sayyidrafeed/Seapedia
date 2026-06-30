import { z } from 'zod';
import { addressResponseSchema } from '@/modules/buyers/buyers.schemas';
import { orderItemResponseSchema } from '@/modules/orders/orders-schemas';

export const deliveryJobResponseSchema = z
  .object({
    id: z.string(),
    orderId: z.string(),
    driverId: z.string().nullable(),
    status: z.string(),
    deliveryFee: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
    // Joined order details for Driver context
    storeName: z.string(),
    deliveryMethod: z.string(),
    addressSnapshot: addressResponseSchema,
    totalAmount: z.number().int(),
    items: z.array(orderItemResponseSchema).optional(),
  })
  .meta({ id: 'DeliveryJobResponse' });

export const deliveryJobListResponseSchema = z
  .array(deliveryJobResponseSchema)
  .meta({ id: 'DeliveryJobListResponse' });

export const driverActionSuccessResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .meta({ id: 'DriverActionSuccessResponse' });

export const driverStatsResponseSchema = z
  .object({
    totalEarnings: z.number().int(),
    completedJobsCount: z.number().int(),
    activeJobs: z.array(deliveryJobResponseSchema),
    completedJobs: z.array(deliveryJobResponseSchema),
  })
  .meta({ id: 'DriverStatsResponse' });

export const driverJobHistoryResponseSchema = z
  .object({
    jobs: z.array(deliveryJobResponseSchema),
    total: z.number().int(),
  })
  .meta({ id: 'DriverJobHistoryResponse' });
