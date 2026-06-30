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
  systemTimeOffset,
  wallets,
  walletTransactions,
  orderItems,
  orderStatusHistory,
} from '@/db/schema';
import { and, sql, eq } from 'drizzle-orm';
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
    const effectiveNow = await this.getEffectiveNow();
    const subHoursStr = (h: number) =>
      new Date(effectiveNow.getTime() - h * 60 * 60 * 1000).toISOString();

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

  static async getEffectiveNow(): Promise<Date> {
    const [row] = await db
      .select()
      .from(systemTimeOffset)
      .where(eq(systemTimeOffset.id, 1))
      .limit(1);
    const offsetSeconds = row?.offsetSeconds ?? 0;
    return new Date(Date.now() + offsetSeconds * 1000);
  }

  static async simulateTime(
    hoursToAdvance: number,
  ): Promise<{ newOffsetHours: number; effectiveTime: string }> {
    const [row] = await db
      .select()
      .from(systemTimeOffset)
      .where(eq(systemTimeOffset.id, 1))
      .limit(1);
    const currentOffsetSeconds = row?.offsetSeconds ?? 0;
    let newOffsetSeconds = currentOffsetSeconds;
    if (hoursToAdvance === 0) {
      newOffsetSeconds = 0;
    } else {
      newOffsetSeconds += hoursToAdvance * 3600;
    }

    // Clamp to MAX_TIME_SIMULATE_HOURS (240 hours)
    const maxOffsetSeconds = 240 * 3600;
    if (newOffsetSeconds > maxOffsetSeconds) {
      newOffsetSeconds = maxOffsetSeconds;
    }

    await db
      .insert(systemTimeOffset)
      .values({
        id: 1,
        offsetSeconds: newOffsetSeconds,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemTimeOffset.id,
        set: {
          offsetSeconds: newOffsetSeconds,
          updatedAt: new Date(),
        },
      });

    const effectiveTime = new Date(Date.now() + newOffsetSeconds * 1000);
    return {
      newOffsetHours: newOffsetSeconds / 3600,
      effectiveTime: effectiveTime.toISOString(),
    };
  }

  static async processOverdueOrders() {
    const effectiveNow = await this.getEffectiveNow();

    const subHoursStr = (h: number) =>
      new Date(effectiveNow.getTime() - h * 60 * 60 * 1000).toISOString();

    const overdueOrdersList = await db
      .select()
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
      );

    const results = [];

    for (const overdueOrder of overdueOrdersList) {
      try {
        const result = await db.transaction(async (tx) => {
          // 1. Lock the order to prevent concurrent edits
          const [order] = await tx
            .select()
            .from(orders)
            .where(eq(orders.id, overdueOrder.id))
            .for('update')
            .limit(1);

          if (!order || order.status === 'pesanan_selesai' || order.status === 'dikembalikan') {
            return null; // Skip if already completed or returned
          }

          // 2. Mark status as 'dikembalikan'
          await tx
            .update(orders)
            .set({ status: 'dikembalikan', updatedAt: new Date() })
            .where(eq(orders.id, order.id));

          // 3. Status history entry
          const note = `Auto-returned: exceeded delivery SLA for ${order.deliveryMethod}. Refund issued.`;
          await tx.insert(orderStatusHistory).values({
            orderId: order.id,
            status: 'dikembalikan',
            note,
          });

          // 4. Refund Buyer Wallet (orders are pre-paid by buyer wallet in Seapedia)
          let [wallet] = await tx
            .select()
            .from(wallets)
            .where(eq(wallets.userId, order.buyerId))
            .limit(1);
          if (!wallet) {
            // Self-heal/fallback if buyer wallet is somehow missing
            [wallet] = await tx
              .insert(wallets)
              .values({ userId: order.buyerId, balance: 0 })
              .returning();
          }

          await tx
            .update(wallets)
            .set({
              balance: sql`${wallets.balance} + ${order.totalAmount}`,
              updatedAt: new Date(),
            })
            .where(eq(wallets.id, wallet.id));

          // Insert wallet transaction for refund
          const reference = 'REFUND-' + order.id;
          await tx.insert(walletTransactions).values({
            walletId: wallet.id,
            amount: order.totalAmount,
            type: 'refund',
            status: 'success',
            reference,
          });

          // 5. Restore product stocks
          const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
          let itemsRestored = 0;
          for (const item of items) {
            if (item.productId) {
              await tx
                .update(products)
                .set({
                  stock: sql`${products.stock} + ${item.quantity}`,
                  updatedAt: new Date(),
                })
                .where(eq(products.id, item.productId));
              itemsRestored += item.quantity;
            }
          }

          return {
            orderId: order.id,
            buyerId: order.buyerId,
            refundAmount: order.totalAmount,
            itemsRestored,
            note,
          };
        });

        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Failed to process overdue order ${overdueOrder.id}:`, error);
      }
    }

    return {
      processedCount: results.length,
      results,
    };
  }
}
