import { db } from '@/db';
import { users, stores, products, orders, vouchers, promos, deliveryJobs, simulationState } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export class AdminService {
  static async getSimulatedNowExpr(): Promise<ReturnType<typeof sql>> {
    const [state] = await db
      .select()
      .from(simulationState)
      .where(eq(simulationState.id, '00000000-0000-0000-0000-000000000001'))
      .limit(1);

    const offset = state?.dayOffset ?? 0;
    return sql`NOW() + ${offset} * INTERVAL '1 day'`;
  }

  static async getMonitoringStats() {
    const [userCount] = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(users);
    const [storeCount] = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(stores);
    const [productCount] = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(products);
    const [orderCount] = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(orders);

    const [revenueSum] = await db
      .select({ total: sql<number>`CAST(COALESCE(SUM(${orders.totalAmount}), 0) AS INTEGER)` })
      .from(orders)
      .where(eq(orders.status, 'pesanan_selesai'));

    const [voucherCount] = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(vouchers);
    const [promoCount] = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(promos);
    const [deliveryJobCount] = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(deliveryJobs);

    const simulatedNow = await this.getSimulatedNowExpr();

    const [overdueCount] = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(orders)
      .where(
        sql`${orders.status} NOT IN ('pesanan_selesai', 'dikembalikan') AND (
          CASE ${orders.deliveryMethod}
            WHEN 'instant' THEN ${orders.createdAt} < ${simulatedNow} - INTERVAL '12 hours'
            WHEN 'next_day' THEN ${orders.createdAt} < ${simulatedNow} - INTERVAL '24 hours'
            WHEN 'regular' THEN ${orders.createdAt} < ${simulatedNow} - INTERVAL '3 days'
            ELSE FALSE
          END
        )`,
      );

    return {
      totalUsers: userCount?.count || 0,
      totalStores: storeCount?.count || 0,
      totalProducts: productCount?.count || 0,
      totalOrders: orderCount?.count || 0,
      totalRevenue: revenueSum?.total || 0,
      totalVouchers: voucherCount?.count || 0,
      totalPromos: promoCount?.count || 0,
      totalDeliveryJobs: deliveryJobCount?.count || 0,
      totalOverdueOrders: overdueCount?.count || 0,
    };
  }
}
