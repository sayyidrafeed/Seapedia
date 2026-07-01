import { db } from '@/db';
import {
  deliveryJobs,
  orders,
  stores,
  orderStatusHistory,
  orderItems,
  products,
} from '@/db/schema';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { NotFoundError, ConflictError } from '@/lib/errors';

const jobColumns = {
  id: deliveryJobs.id,
  orderId: deliveryJobs.orderId,
  driverId: deliveryJobs.driverId,
  status: deliveryJobs.status,
  deliveryFee: deliveryJobs.deliveryFee,
  createdAt: deliveryJobs.createdAt,
  updatedAt: deliveryJobs.updatedAt,
  storeName: stores.name,
  deliveryMethod: orders.deliveryMethod,
  addressSnapshot: orders.addressSnapshot,
  totalAmount: orders.totalAmount,
};

interface RawJob {
  id: string;
  orderId: string;
  driverId: string | null;
  status: string;
  deliveryFee: number;
  createdAt: Date;
  updatedAt: Date;
  storeName: string;
  deliveryMethod: string;
  addressSnapshot: string;
  totalAmount: number;
}

const mapJob = (job: RawJob) => ({
  ...job,
  addressSnapshot: JSON.parse(job.addressSnapshot),
  createdAt: job.createdAt.toISOString(),
  updatedAt: job.updatedAt.toISOString(),
});

export class DriverService {
  static async getAvailableJobs() {
    const list = await db
      .select(jobColumns)
      .from(deliveryJobs)
      .innerJoin(orders, eq(deliveryJobs.orderId, orders.id))
      .innerJoin(stores, eq(orders.storeId, stores.id))
      .where(and(eq(deliveryJobs.status, 'pending'), eq(orders.status, 'menunggu_pengirim')))
      .limit(50);
    return list.map(mapJob);
  }

  static async getJobDetail(jobId: string) {
    const [job] = await db
      .select(jobColumns)
      .from(deliveryJobs)
      .innerJoin(orders, eq(deliveryJobs.orderId, orders.id))
      .innerJoin(stores, eq(orders.storeId, stores.id))
      .where(eq(deliveryJobs.id, jobId))
      .limit(1);
    if (!job) throw new NotFoundError('Delivery job not found');

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, job.orderId));

    return {
      ...mapJob(job),
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productPrice: item.productPrice,
        quantity: item.quantity,
      })),
    };
  }

  static async takeJob(jobId: string, driverId: string) {
    return await db.transaction(async (tx) => {
      const [job] = await tx
        .update(deliveryJobs)
        .set({ status: 'taken', driverId, updatedAt: new Date() })
        .where(and(eq(deliveryJobs.id, jobId), eq(deliveryJobs.status, 'pending')))
        .returning();
      if (!job) throw new ConflictError('Delivery job unavailable');

      const [order] = await tx
        .update(orders)
        .set({ status: 'sedang_dikirim', updatedAt: new Date() })
        .where(and(eq(orders.id, job.orderId), eq(orders.status, 'menunggu_pengirim')))
        .returning();
      if (!order) throw new ConflictError('Order not ready for delivery');

      await tx.insert(orderStatusHistory).values({
        orderId: job.orderId,
        status: 'sedang_dikirim',
        note: 'Driver is delivering your order',
      });
      return { success: true, message: 'Delivery job taken successfully' };
    });
  }

  static async completeJob(jobId: string, driverId: string) {
    return await db.transaction(async (tx) => {
      const [job] = await tx
        .update(deliveryJobs)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(
          and(
            eq(deliveryJobs.id, jobId),
            eq(deliveryJobs.driverId, driverId),
            eq(deliveryJobs.status, 'taken'),
          ),
        )
        .returning();
      if (!job) throw new ConflictError('Delivery job cannot be completed');

      const [order] = await tx
        .update(orders)
        .set({ status: 'pesanan_selesai', updatedAt: new Date() })
        .where(and(eq(orders.id, job.orderId), eq(orders.status, 'sedang_dikirim')))
        .returning();
      if (!order) throw new ConflictError('Order is not in delivery status');

      // Increment soldCount on products in the order
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, job.orderId));
      // Sort items by productId to prevent deadlocks during bulk updates
      const sortedItems = [...items].sort((a, b) => {
        if (!a.productId) return 1;
        if (!b.productId) return -1;
        return a.productId.localeCompare(b.productId);
      });
      for (const item of sortedItems) {
        if (item.productId) {
          await tx
            .update(products)
            .set({ soldCount: sql`${products.soldCount} + ${item.quantity}` })
            .where(eq(products.id, item.productId));
        }
      }

      await tx.insert(orderStatusHistory).values({
        orderId: job.orderId,
        status: 'pesanan_selesai',
        note: 'Order has been delivered successfully',
      });
      return { success: true, message: 'Delivery job completed successfully' };
    });
  }

  static async getDriverStats(driverId: string) {
    const active = await db
      .select(jobColumns)
      .from(deliveryJobs)
      .innerJoin(orders, eq(deliveryJobs.orderId, orders.id))
      .innerJoin(stores, eq(orders.storeId, stores.id))
      .where(and(eq(deliveryJobs.driverId, driverId), eq(deliveryJobs.status, 'taken')));

    const [stats] = await db
      .select({
        totalEarnings: sql<number>`CAST(COALESCE(SUM(${deliveryJobs.deliveryFee}), 0) AS INTEGER)`,
        completedCount: count(),
      })
      .from(deliveryJobs)
      .where(and(eq(deliveryJobs.driverId, driverId), eq(deliveryJobs.status, 'completed')));

    const completedJobs = await db
      .select(jobColumns)
      .from(deliveryJobs)
      .innerJoin(orders, eq(deliveryJobs.orderId, orders.id))
      .innerJoin(stores, eq(orders.storeId, stores.id))
      .where(and(eq(deliveryJobs.driverId, driverId), eq(deliveryJobs.status, 'completed')))
      .orderBy(desc(deliveryJobs.updatedAt))
      .limit(10);

    return {
      totalEarnings: stats?.totalEarnings || 0,
      completedJobsCount: stats?.completedCount || 0,
      activeJobs: active.map(mapJob),
      completedJobs: completedJobs.map(mapJob),
    };
  }

  static async getJobHistory(
    driverId: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number } = {},
  ) {
    const offset = (page - 1) * limit;

    const list = await db
      .select(jobColumns)
      .from(deliveryJobs)
      .innerJoin(orders, eq(deliveryJobs.orderId, orders.id))
      .innerJoin(stores, eq(orders.storeId, stores.id))
      .where(and(eq(deliveryJobs.driverId, driverId), eq(deliveryJobs.status, 'completed')))
      .orderBy(desc(deliveryJobs.updatedAt))
      .limit(limit)
      .offset(offset);

    const [totalCount] = await db
      .select({ count: count() })
      .from(deliveryJobs)
      .where(and(eq(deliveryJobs.driverId, driverId), eq(deliveryJobs.status, 'completed')));

    return {
      jobs: list.map(mapJob),
      total: totalCount?.count || 0,
    };
  }
}
