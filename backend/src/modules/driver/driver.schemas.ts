import { z } from 'zod';
import { addressResponseSchema } from '@/modules/buyers/buyers.schemas';

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
  })
  .meta({ id: 'DeliveryJobResponse' });

export const deliveryJobListResponseSchema = z
  .array(deliveryJobResponseSchema)
  .meta({ id: 'DeliveryJobListResponse' });
