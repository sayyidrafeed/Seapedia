import { inventory, productRefs } from '../schema';
import type { Dbs } from '../dbs';
import { rawProducts } from './data/products.data';

export async function seedProducts({ catalog, commerce }: Dbs, storeMap: Map<string, string>) {
  console.log('Seeding products...');

  const productMap = new Map<string, string>();
  const counts = new Map<string, number>();
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - 20);

  for (const raw of rawProducts) {
    const storeId = storeMap.get(raw.storeSlug);
    if (!storeId) {
      console.warn(`Store ${raw.storeSlug} not found for product ${raw.name}. Skipping.`);
      continue;
    }
    const id = crypto.randomUUID();

    await catalog.collection<{ _id: string } & Record<string, unknown>>('products').insertOne({
      _id: id,
      storeId,
      name: raw.name,
      slug: raw.slug,
      description: raw.description,
      price: raw.price,
      imageKey: raw.imageUrl,
      rating: 0, // set by the review seed
      reviewCount: 0,
      soldCount: 0, // set from completed orders at the end
      stock: raw.stock,
      stockVersion: 1,
      version: 1,
      createdAt,
      updatedAt: createdAt,
    });

    // Commerce owns stock and replicates the catalog fields checkout needs.
    await commerce.insert(productRefs).values({
      id,
      storeId,
      name: raw.name,
      slug: raw.slug,
      price: raw.price,
      imageKey: raw.imageUrl,
      version: 1,
    });
    await commerce.insert(inventory).values({ productId: id, stock: raw.stock, version: 1 });

    productMap.set(raw.slug, id);
    counts.set(storeId, (counts.get(storeId) ?? 0) + 1);
  }

  for (const [storeId, totalProducts] of counts) {
    await catalog.collection<{ _id: string } & Record<string, unknown>>('stores').updateOne({ _id: storeId }, { $set: { totalProducts } });
  }

  console.log(`Seeded ${productMap.size} products successfully.`);
  return productMap;
}
