import { db } from '@/db';
import { orders, orderItems, orderStatusHistory, stores } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
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
        discountAmount: orders.discountAmount,
        discountCode: orders.discountCode,
        discountType: orders.discountType,
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

    if (ordersList.length === 0) {
      return [];
    }

    const orderIds = ordersList.map((o) => o.id);
    const allItems = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        productName: orderItems.productName,
        productPrice: orderItems.productPrice,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    type MappedItem = {
      id: string;
      productId: string | null;
      productName: string;
      productPrice: number;
      quantity: number;
    };

    const itemsByOrderId = allItems.reduce(
      (acc, item) => {
        if (!acc[item.orderId]) {
          acc[item.orderId] = [];
        }
        acc[item.orderId].push({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          quantity: item.quantity,
        });
        return acc;
      },
      {} as Record<string, MappedItem[]>,
    );

    return ordersList.map((order) => ({
      ...order,
      addressSnapshot: JSON.parse(order.addressSnapshot),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: itemsByOrderId[order.id] || [],
    }));
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
        discountAmount: orders.discountAmount,
        discountCode: orders.discountCode,
        discountType: orders.discountType,
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
