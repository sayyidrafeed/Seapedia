import { db } from '@/db';
import { users, stores, products, orders, vouchers, promos, deliveryJobs } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export class AdminService {
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

    const [overdueCount] = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(orders)
      .where(
        sql`status NOT IN ('pesanan_selesai', 'dikembalikan') AND (
          (delivery_method = 'instant' AND created_at < NOW() - INTERVAL '12 hours') OR
          (delivery_method = 'next_day' AND created_at < NOW() - INTERVAL '24 hours') OR
          (delivery_method = 'regular' AND created_at < NOW() - INTERVAL '3 days')
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
