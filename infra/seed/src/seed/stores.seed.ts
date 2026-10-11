import { storeRefs, stores } from '../schema';
import type { Dbs } from '../dbs';
import { rawStores } from './data/stores.data';

export async function seedStores({ catalog: tx, commerce }: Dbs, userMap: Map<string, string>) {
  console.log('Seeding stores...');

  const storeMap = new Map<string, string>();

  for (const raw of rawStores) {
    const sellerId = userMap.get(raw.sellerUsername);
    if (!sellerId) {
      console.warn(`Seller user ${raw.sellerUsername} not found for store ${raw.name}. Skipping.`);
      continue;
    }

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - raw.createdAtDaysAgo);

    const [insertedStore] = await tx
      .insert(stores)
      .values({
        sellerId,
        name: raw.name,
        slug: raw.slug,
        description: raw.description,
        logoKey: raw.logoUrl,
        rating: '0.00',
        reviewCount: 0,
        totalProducts: 0,
        createdAt,
        updatedAt: createdAt,
      })
      .returning();

    storeMap.set(raw.slug, insertedStore.id);

    // Commerce's replica, normally filled from catalog's outbox.
    await commerce.insert(storeRefs).values({
      id: insertedStore.id,
      sellerId,
      name: insertedStore.name,
      slug: insertedStore.slug,
    });
  }

  console.log(`Seeded ${rawStores.length} stores successfully.`);
  return storeMap;
}
