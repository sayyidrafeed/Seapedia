import { z } from 'zod';

export const dashboardStatsResponseSchema = z
  .object({
    users: z.object({
      total: z.number().int(),
      roles: z.object({
        admin: z.number().int(),
        buyer: z.number().int(),
        seller: z.number().int(),
        driver: z.number().int(),
      }),
    }),
    stores: z.object({
      total: z.number().int(),
    }),
    products: z.object({
      total: z.number().int(),
    }),
    orders: z.object({
      total: z.number().int(),
      statuses: z.object({
        sedang_dikemas: z.number().int(),
        menunggu_pengirim: z.number().int(),
        sedang_dikirim: z.number().int(),
        pesanan_selesai: z.number().int(),
        dikembalikan: z.number().int(),
      }),
    }),
    discounts: z.object({
      vouchers: z.number().int(),
      promos: z.number().int(),
    }),
    deliveries: z.object({
      total: z.number().int(),
      statuses: z.object({
        pending: z.number().int(),
        taken: z.number().int(),
        completed: z.number().int(),
      }),
    }),
    overdueOrders: z.object({
      total: z.number().int(),
    }),
  })
  .meta({ id: 'DashboardStatsResponse' });
