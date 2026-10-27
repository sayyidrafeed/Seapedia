import { describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { ConflictError, NotFoundError } from '@seapedia/platform/errors';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { deliveryJobs, orders } from '@/db/schema';
import { outboxEvents } from '../../../test/db';
import { seedOrder, seedProduct, seedStore } from '../../../test/fixtures';
import { DriverService } from './driver.service';

const driverId = randomUUID();

// An order the seller has packed, with its open delivery job.
async function readyJob(deliveryFee = 5_000) {
  const store = await seedStore();
  const product = await seedProduct(store.id);
  const order = await seedOrder(
    { buyerId: randomUUID(), storeId: store.id, status: 'menunggu_pengirim' },
    [{ productId: product.id, quantity: 2, price: 1_000 }],
  );
  const [job] = await db
    .insert(deliveryJobs)
    .values({ orderId: order.id, deliveryFee })
    .returning();
  return { job, order, product };
}

const orderStatus = async (id: string) =>
  (await db.select().from(orders).where(eq(orders.id, id)))[0].status;

describe('DriverService', () => {
  test('lists open jobs with the store and parsed address', async () => {
    await readyJob();
    const [job] = await DriverService.getAvailableJobs();
    expect(job).toMatchObject({
      storeName: 'Toko Laut',
      addressSnapshot: { recipientName: 'Dewi' },
    });
  });

  test('job detail includes the order items; an unknown job is not found', async () => {
    const { job } = await readyJob();
    expect((await DriverService.getJobDetail(job.id)).items).toMatchObject([
      { productPrice: 1_000, quantity: 2 },
    ]);
    await expect(DriverService.getJobDetail(randomUUID())).rejects.toThrow(NotFoundError);
  });

  test('taking a job ships the order; a second driver cannot take it', async () => {
    const { job, order } = await readyJob();

    await DriverService.takeJob(job.id, driverId);

    expect(await orderStatus(order.id)).toBe('sedang_dikirim');
    expect(await DriverService.getAvailableJobs()).toEqual([]);
    await expect(DriverService.takeJob(job.id, randomUUID())).rejects.toThrow(ConflictError);
  });

  test('completing a delivery finishes the order and tells catalog what sold', async () => {
    const { job, order, product } = await readyJob();
    await DriverService.takeJob(job.id, driverId);

    await expect(DriverService.completeJob(job.id, randomUUID())).rejects.toThrow(ConflictError);
    await DriverService.completeJob(job.id, driverId);

    expect(await orderStatus(order.id)).toBe('pesanan_selesai');
    expect(await outboxEvents()).toMatchObject([
      {
        type: 'commerce.order.completed',
        data: { orderId: order.id, items: [{ productId: product.id, quantity: 2 }] },
      },
    ]);
  });

  test('stats and history count only completed jobs of that driver', async () => {
    const completed = await readyJob(8_000);
    await DriverService.takeJob(completed.job.id, driverId);
    await DriverService.completeJob(completed.job.id, driverId);
    const active = await readyJob();
    await DriverService.takeJob(active.job.id, driverId);
    const someoneElses = await readyJob(99_000);
    await DriverService.takeJob(someoneElses.job.id, randomUUID());

    const stats = await DriverService.getDriverStats(driverId);
    expect(stats).toMatchObject({ totalEarnings: 8_000, completedJobsCount: 1 });
    expect(stats.activeJobs.map((j) => j.id)).toEqual([active.job.id]);
    expect(await DriverService.getJobHistory(driverId, { page: 1, limit: 10 })).toMatchObject({
      jobs: [{ id: completed.job.id }],
      total: 1,
    });
  });
});
