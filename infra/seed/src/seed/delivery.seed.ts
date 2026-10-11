/* eslint-disable @typescript-eslint/no-explicit-any, max-lines */
import { inArray } from 'drizzle-orm';
import { deliveryJobs, orders } from '../schema';

export async function seedDelivery(
  tx: any,
  orderMap: Map<string, string>,
  userMap: Map<string, string>,
) {
  console.log('Seeding delivery jobs...');

  const drivers = ['joko_widodo', 'budi_hartono', 'agus_wijaya'];
  const driverIds: string[] = [];
  for (const d of drivers) {
    const id = userMap.get(d);
    if (id) {
      driverIds.push(id);
    } else {
      console.warn(`Driver user ${d} not found in userMap.`);
    }
  }

  if (driverIds.length === 0) {
    console.error('No drivers found. Skipping delivery jobs seeding.');
    return;
  }

  // We assign weight based on:
  // index 0: ~54% weight
  // index 1: ~31% weight
  // index 2: ~15% weight
  function pickDriverId(): string {
    const r = Math.random();
    if (r < 0.54 || driverIds.length < 2) return driverIds[0];
    if (r < 0.85 || driverIds.length < 3) return driverIds[1];
    return driverIds[2];
  }

  let jobCount = 0;
  const orderIds = Array.from(orderMap.values());

  if (orderIds.length === 0) {
    console.log('No orders to seed delivery jobs for.');
    return;
  }

  // Retrieve all orders in a single batch
  const allOrders = await tx.select().from(orders).where(inArray(orders.id, orderIds));

  const jobsToInsert: any[] = [];

  for (const order of allOrders) {
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

      jobsToInsert.push({
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

  if (jobsToInsert.length > 0) {
    await tx.insert(deliveryJobs).values(jobsToInsert);
  }

  console.log(`Seeded ${jobCount} delivery jobs successfully.`);
}
