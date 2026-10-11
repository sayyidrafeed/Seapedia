import { db } from './index';
import { systemTimeOffset } from './schema';
import {
  seedUsers,
  seedWallets,
  seedStores,
  seedProducts,
  seedDiscounts,
  seedOrders,
  seedDelivery,
  seedReviews,
  seedCarts,
} from './seed/index';

async function seed() {
  console.log('Starting database seeding');

  try {
    await db.transaction(async (tx) => {
      // 1. Seed users (deletes previous seeded users and inserts roles/sessions)
      const userMap = await seedUsers(tx);

      // 2. Seed wallets (creates wallets for non-admins, adds topups, seeds addresses)
      await seedWallets(tx, userMap);

      // 3. Seed stores
      const storeMap = await seedStores(tx, userMap);

      // 4. Seed products (associates to stores, updates store totalProducts)
      const productMap = await seedProducts(tx, storeMap);

      // 5. Seed discounts (vouchers and promos)
      const { voucherMap, promoMap } = await seedDiscounts(tx);

      // 6. Seed orders (creates orders, orderItems, orderStatusHistory, payments & refunds)
      const orderMap = await seedOrders(tx, userMap, storeMap, productMap, voucherMap, promoMap);

      // 7. Seed delivery jobs (assigns drivers to orders waiting for shipment, in shipping, or completed)
      await seedDelivery(tx, orderMap, userMap);

      // 8. Seed reviews (adds product reviews and app reviews, calculates ratings for products/stores)
      await seedReviews(tx, userMap, productMap, orderMap);

      // 9. Seed active carts (creates carts and cartItems for a few buyers)
      await seedCarts(tx, userMap, productMap, storeMap);

      // 10. Ensure system time offset exists
      await tx
        .insert(systemTimeOffset)
        .values({
          id: 1,
          offsetSeconds: 0,
        })
        .onConflictDoNothing();
    });

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Fatal error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seed();
