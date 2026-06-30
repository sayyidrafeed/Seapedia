import { db } from '@/db';
import {
  users,
  userRole,
  stores,
  products,
  orders,
  vouchers,
  promos,
  deliveryJobs,
} from '@/db/schema';
import { and, sql } from 'drizzle-orm';
import { DELIVERY_SLA_HOURS } from './admin.constants';

export interface DashboardStats {
  users: {
    total: number;
    roles: { admin: number; buyer: number; seller: number; driver: number };
  };
  stores: { total: number };
  products: { total: number };
  orders: {
    total: number;
    statuses: {
      sedang_dikemas: number;
      menunggu_pengirim: number;
      sedang_dikirim: number;
      pesanan_selesai: number;
      dikembalikan: number;
    };
  };
  discounts: { vouchers: number; promos: number };
  deliveries: {
    total: number;
    statuses: { pending: number; taken: number; completed: number };
  };
  overdueOrders: { total: number };
}

export class AdminService {
  static async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const subHoursStr = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

    const [
      totalUsersRes,
      rolesCounts,
      storesCountRes,
      productsCountRes,
      ordersCountRes,
      ordersCounts,
      vouchersCountRes,
      promosCountRes,
      deliveriesCountRes,
      deliveriesCounts,
      overdueOrdersRes,
    ] = await Promise.all([
      // 1. Users count
      db.select({ count: sql<number>`count(distinct ${users.id})::int` }).from(users),
      // 2. Roles count
      db
        .select({ role: userRole.role, count: sql<number>`count(${userRole.id})::int` })
        .from(userRole)
        .groupBy(userRole.role),
      // 3. Stores count
      db.select({ count: sql<number>`count(${stores.id})::int` }).from(stores),
      // 4. Products count
      db.select({ count: sql<number>`count(${products.id})::int` }).from(products),
      // 5. Orders count
      db.select({ count: sql<number>`count(${orders.id})::int` }).from(orders),
      // 6. Order statuses count
      db
        .select({ status: orders.status, count: sql<number>`count(${orders.id})::int` })
        .from(orders)
        .groupBy(orders.status),
      // 7. Vouchers count
      db.select({ count: sql<number>`count(${vouchers.id})::int` }).from(vouchers),
      // 8. Promos count
      db.select({ count: sql<number>`count(${promos.id})::int` }).from(promos),
      // 9. Delivery Jobs count
      db.select({ count: sql<number>`count(${deliveryJobs.id})::int` }).from(deliveryJobs),
      // 10. Delivery Job statuses count
      db
        .select({ status: deliveryJobs.status, count: sql<number>`count(${deliveryJobs.id})::int` })
        .from(deliveryJobs)
        .groupBy(deliveryJobs.status),
      // 11. Overdue Orders count
      db
        .select({ count: sql<number>`count(${orders.id})::int` })
        .from(orders)
        .where(
          and(
            sql`${orders.status} NOT IN ('pesanan_selesai', 'dikembalikan')`,
            sql`(
              (${orders.deliveryMethod} = 'instant' AND ${orders.createdAt} < ${subHoursStr(DELIVERY_SLA_HOURS.instant)}) OR
              (${orders.deliveryMethod} = 'next_day' AND ${orders.createdAt} < ${subHoursStr(DELIVERY_SLA_HOURS.next_day)}) OR
              (${orders.deliveryMethod} = 'regular' AND ${orders.createdAt} < ${subHoursStr(DELIVERY_SLA_HOURS.regular)})
            )`,
          ),
        ),
    ]);

    const totalUsers = totalUsersRes[0]?.count || 0;

    const roles = { admin: 0, buyer: 0, seller: 0, driver: 0 };
    for (const r of rolesCounts) {
      if (r.role in roles) roles[r.role as keyof typeof roles] = r.count;
    }

    const totalStores = storesCountRes[0]?.count || 0;
    const totalProducts = productsCountRes[0]?.count || 0;
    const totalOrders = ordersCountRes[0]?.count || 0;

    const orderStatuses = {
      sedang_dikemas: 0,
      menunggu_pengirim: 0,
      sedang_dikirim: 0,
      pesanan_selesai: 0,
      dikembalikan: 0,
    };
    for (const o of ordersCounts) {
      if (o.status in orderStatuses)
        orderStatuses[o.status as keyof typeof orderStatuses] = o.count;
    }

    const totalVouchers = vouchersCountRes[0]?.count || 0;
    const totalPromos = promosCountRes[0]?.count || 0;
    const totalDeliveries = deliveriesCountRes[0]?.count || 0;

    const deliveryStatuses = { pending: 0, taken: 0, completed: 0 };
    for (const d of deliveriesCounts) {
      if (d.status in deliveryStatuses)
        deliveryStatuses[d.status as keyof typeof deliveryStatuses] = d.count;
    }

    return {
      users: { total: totalUsers, roles },
      stores: { total: totalStores },
      products: { total: totalProducts },
      orders: { total: totalOrders, statuses: orderStatuses },
      discounts: { vouchers: totalVouchers, promos: totalPromos },
      deliveries: { total: totalDeliveries, statuses: deliveryStatuses },
      overdueOrders: { total: overdueOrdersRes[0]?.count || 0 },
    };
  }
}
