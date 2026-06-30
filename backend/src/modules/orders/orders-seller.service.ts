import { db } from '@/db';
import { orders, orderItems, orderStatusHistory, stores, deliveryJobs } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { NotFoundError, ConflictError } from '@/lib/errors';

export class OrdersSellerService {
  static async list(sellerId: string) {
    const [store] = await db.select().from(stores).where(eq(stores.sellerId, sellerId)).limit(1);
    if (!store) {
      return [];
    }

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
      .where(eq(orders.storeId, store.id))
      .orderBy(desc(orders.createdAt));

    if (ordersList.length === 0) {
      return [];
    }

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
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.storeId, store.id));

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

  static async getDetail(sellerId: string, orderId: string) {
    const [store] = await db.select().from(stores).where(eq(stores.sellerId, sellerId)).limit(1);
    if (!store) {
      throw new NotFoundError('Store not found for this seller');
    }

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
      .where(and(eq(orders.id, orderId), eq(orders.storeId, store.id)))
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

  static async processOrder(sellerId: string, orderId: string, note?: string) {
    const [store] = await db.select().from(stores).where(eq(stores.sellerId, sellerId)).limit(1);
    if (!store) {
      throw new NotFoundError('Store not found for this seller');
    }

    await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.storeId, store.id)))
        .limit(1);

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.status !== 'sedang_dikemas') {
        throw new ConflictError(
          `Order cannot be processed because it is in status ${order.status}`,
        );
      }

      await tx
        .update(orders)
        .set({
          status: 'menunggu_pengirim',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        status: 'menunggu_pengirim',
        note: note || null,
      });

      await tx.insert(deliveryJobs).values({
        orderId: order.id,
        status: 'pending',
        deliveryFee: order.deliveryFee,
      });
    });

    return this.getDetail(sellerId, orderId);
  }

  static async getReport(sellerId: string) {
    const [store] = await db.select().from(stores).where(eq(stores.sellerId, sellerId)).limit(1);
    if (!store) {
      return {
        totalIncome: 0,
        totalOrders: 0,
        averageRevenue: 0,
        orders: [],
      };
    }

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
      .where(eq(orders.storeId, store.id))
      .orderBy(desc(orders.createdAt));

    if (ordersList.length === 0) {
      return {
        totalIncome: 0,
        totalOrders: 0,
        averageRevenue: 0,
        orders: [],
      };
    }

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
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.storeId, store.id));

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

    const formattedOrders = ordersList.map((order) => ({
      ...order,
      addressSnapshot: JSON.parse(order.addressSnapshot),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: itemsByOrderId[order.id] || [],
    }));

    const completedOrders = formattedOrders.filter((o) => o.status === 'pesanan_selesai');
    const totalIncome = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalOrders = completedOrders.length;
    const averageRevenue = totalOrders > 0 ? Math.round(totalIncome / totalOrders) : 0;

    return {
      totalIncome,
      totalOrders,
      averageRevenue,
      orders: formattedOrders,
    };
  }
}
