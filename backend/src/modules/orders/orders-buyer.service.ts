import { db } from '@/db';
import { orders, orderItems, orderStatusHistory, stores } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';

export class OrdersBuyerService {
  static async list(buyerId: string) {
    const ordersList = await db
      .select({
        id: orders.id,
        buyerId: orders.buyerId,
        storeId: orders.storeId,
        storeName: stores.name,
        deliveryMethod: orders.deliveryMethod,
        subtotal: orders.subtotal,
        deliveryFee: orders.deliveryFee,
        ppn: orders.ppn,
        totalAmount: orders.totalAmount,
        status: orders.status,
        addressSnapshot: orders.addressSnapshot,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .innerJoin(stores, eq(orders.storeId, stores.id))
      .where(eq(orders.buyerId, buyerId))
      .orderBy(desc(orders.createdAt));

    const result = [];
    for (const order of ordersList) {
      const items = await db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          productName: orderItems.productName,
          productPrice: orderItems.productPrice,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      result.push({
        ...order,
        addressSnapshot: JSON.parse(order.addressSnapshot),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items,
      });
    }

    return result;
  }

  static async getDetail(buyerId: string, orderId: string) {
    const [order] = await db
      .select({
        id: orders.id,
        buyerId: orders.buyerId,
        storeId: orders.storeId,
        storeName: stores.name,
        deliveryMethod: orders.deliveryMethod,
        subtotal: orders.subtotal,
        deliveryFee: orders.deliveryFee,
        ppn: orders.ppn,
        totalAmount: orders.totalAmount,
        status: orders.status,
        addressSnapshot: orders.addressSnapshot,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .innerJoin(stores, eq(orders.storeId, stores.id))
      .where(and(eq(orders.id, orderId), eq(orders.buyerId, buyerId)))
      .limit(1);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        productName: orderItems.productName,
        productPrice: orderItems.productPrice,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    const statusHistory = await db
      .select({
        id: orderStatusHistory.id,
        status: orderStatusHistory.status,
        note: orderStatusHistory.note,
        createdAt: orderStatusHistory.createdAt,
      })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(desc(orderStatusHistory.createdAt));

    return {
      ...order,
      addressSnapshot: JSON.parse(order.addressSnapshot),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items,
      statusHistory: statusHistory.map((sh) => ({
        ...sh,
        createdAt: sh.createdAt.toISOString(),
      })),
    };
  }
}
