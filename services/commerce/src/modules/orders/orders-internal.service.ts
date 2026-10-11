import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { orderItems, orders } from '@/db/schema';

const COMPLETED = 'pesanan_selesai';

/** Order facts other services need, answered from commerce's own data. */
export class OrdersInternalService {
  /** Whether the buyer has a completed order containing the product (gate for reviews). */
  static async hasCompletedPurchase(buyerId: string, productId: string) {
    const [row] = await db
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(orders.buyerId, buyerId),
          eq(orderItems.productId, productId),
          eq(orders.status, COMPLETED),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  /** Units sold per product across completed orders. Products without sales report 0. */
  static async soldCounts(productIds: string[]) {
    if (productIds.length === 0) return [];
    const rows = await db
      .select({
        productId: orderItems.productId,
        soldCount: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(inArray(orderItems.productId, productIds), eq(orders.status, COMPLETED)))
      .groupBy(orderItems.productId);
    const byId = new Map(rows.map((r) => [r.productId, r.soldCount]));
    return productIds.map((productId) => ({ productId, soldCount: byId.get(productId) ?? 0 }));
  }
}
