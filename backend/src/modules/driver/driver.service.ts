import { db } from '@/db';
import { deliveryJobs, orders, stores } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';

export class DriverService {
  static async getAvailableJobs() {
    const results = await db
      .select({
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
      })
      .from(deliveryJobs)
      .innerJoin(orders, eq(deliveryJobs.orderId, orders.id))
      .innerJoin(stores, eq(orders.storeId, stores.id))
      .where(and(eq(deliveryJobs.status, 'pending'), eq(orders.status, 'menunggu_pengirim')))
      .limit(50);

    return results.map((job) => ({
      ...job,
      addressSnapshot: JSON.parse(job.addressSnapshot),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    }));
  }

  static async getJobDetail(jobId: string) {
    const [job] = await db
      .select({
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
      })
      .from(deliveryJobs)
      .innerJoin(orders, eq(deliveryJobs.orderId, orders.id))
      .innerJoin(stores, eq(orders.storeId, stores.id))
      .where(eq(deliveryJobs.id, jobId))
      .limit(1);

    if (!job) {
      throw new NotFoundError('Delivery job not found');
    }

    return {
      ...job,
      addressSnapshot: JSON.parse(job.addressSnapshot),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
