/* eslint-disable @typescript-eslint/no-explicit-any, max-lines */
import { eq } from 'drizzle-orm';
import { deliveryJobs, orders } from '../schema';

export async function seedDelivery(
  tx: any,
  orderMap: Map<string, string>,
  userMap: Map<string, string>,
) {
  console.log('Seeding delivery jobs...');

  const drivers = ['joko_widodo', 'budi_hartono', 'agus_wijaya'];
  const driverIds = drivers.map((d) => userMap.get(d)!);

  // We assign weight based on:
  // joko_widodo (index 0): ~54% weight
  // budi_hartono (index 1): ~31% weight
  // agus_wijaya (index 2): ~15% weight
  function pickDriverId(): string {
    const r = Math.random();
    if (r < 0.54) return driverIds[0];
    if (r < 0.85) return driverIds[1];
    return driverIds[2];
  }

  let jobCount = 0;

  // Retrieve all orders and their delivery fees
  for (const orderId of orderMap.values()) {
    const order = await tx.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) continue;

    let jobStatus: string | null = null;
    let driverId: string | null = null;

    if (order.status === 'menunggu_pengirim') {
      jobStatus = 'pending';
    } else if (order.status === 'sedang_dikirim') {
      jobStatus = 'taken';
      driverId = pickDriverId();
    } else if (order.status === 'pesanan_selesai' || order.status === 'dikembalikan') {
      jobStatus = 'completed';
      driverId = pickDriverId();
    }

    if (jobStatus) {
      const createdAt = new Date(order.createdAt);
      createdAt.setHours(createdAt.getHours() + 1);

      await tx.insert(deliveryJobs).values({
        orderId: order.id,
        driverId,
        status: jobStatus,
        deliveryFee: order.deliveryFee,
        createdAt,
        updatedAt: createdAt,
      });

      jobCount++;
    }
  }

  console.log(`Seeded ${jobCount} delivery jobs successfully.`);
}
