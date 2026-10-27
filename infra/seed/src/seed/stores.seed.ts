import { storeRefs } from '../schema';
import type { Dbs } from '../dbs';
import { rawStores } from './data/stores.data';

export async function seedStores({ catalog, commerce }: Dbs, userMap: Map<string, string>) {
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
    const id = crypto.randomUUID();

    await catalog.collection<{ _id: string } & Record<string, unknown>>('stores').insertOne({
      _id: id,
      sellerId,
      name: raw.name,
      slug: raw.slug,
      description: raw.description,
      logoKey: raw.logoUrl,
      rating: 0,
      reviewCount: 0,
      totalProducts: 0,
      version: 1,
      createdAt,
      updatedAt: createdAt,
    });

    // Commerce's replica, normally filled from `catalog.store.upserted`.
    await commerce
      .insert(storeRefs)
      .values({ id, sellerId, name: raw.name, slug: raw.slug, version: 1 });
    storeMap.set(raw.slug, id);
  }

  console.log(`Seeded ${rawStores.length} stores successfully.`);
  return storeMap;
}
