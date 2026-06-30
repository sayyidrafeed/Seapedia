import { z } from 'zod';

export const adminMonitoringResponseSchema = z
  .object({
    totalUsers: z.number().int(),
    totalStores: z.number().int(),
    totalProducts: z.number().int(),
    totalOrders: z.number().int(),
    totalRevenue: z.number().int(),
    totalVouchers: z.number().int(),
    totalPromos: z.number().int(),
    totalDeliveryJobs: z.number().int(),
    totalOverdueOrders: z.number().int(),
  })
  .meta({ id: 'AdminMonitoringResponse' });
