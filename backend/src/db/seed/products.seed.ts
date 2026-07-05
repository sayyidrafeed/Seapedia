/* eslint-disable @typescript-eslint/no-explicit-any, max-lines */
import { eq } from 'drizzle-orm';
import { products, stores } from '../schema';
import { rawProducts } from './data/products.data';

export async function seedProducts(tx: any, storeMap: Map<string, string>) {
  console.log('Seeding products...');

  const productMap = new Map<string, string>();
  const storeProductCounts = new Map<string, number>();

  for (const raw of rawProducts) {
    const storeId = storeMap.get(raw.storeSlug);
    if (!storeId) {
      console.warn(`Store ${raw.storeSlug} not found for product ${raw.name}. Skipping.`);
      continue;
    }

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - 20); // 20 days ago

    const [insertedProduct] = await tx
      .insert(products)
      .values({
        storeId,
        name: raw.name,
        slug: raw.slug,
        description: raw.description,
        price: raw.price,
        stock: raw.stock,
        imageKey: raw.imageUrl,
        rating: '0.00', // Will be calculated and updated during review seed
        reviewCount: 0,
        soldCount: 0, // Will be calculated during order seed
        createdAt,
        updatedAt: createdAt,
      })
      .returning();

    productMap.set(raw.slug, insertedProduct.id);

    // Track total products per store
    const currentCount = storeProductCounts.get(storeId) || 0;
    storeProductCounts.set(storeId, currentCount + 1);
  }

  // Update store totalProducts count
  for (const [storeId, count] of storeProductCounts.entries()) {
    await tx
      .update(stores)
      .set({
        totalProducts: count,
      })
      .where(eq(stores.id, storeId));
  }

  console.log(`Seeded ${rawProducts.length} products successfully.`);
  return productMap;
}
