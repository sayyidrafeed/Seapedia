/* eslint-disable @typescript-eslint/no-explicit-any, max-lines */
import { eq } from 'drizzle-orm';
import { products, stores } from '../schema';
import { rawProducts } from './data/products.data';

export async function seedProducts(tx: any, storeMap: Map<string, string>) {
  console.log('Seeding products...');

  const productMap = new Map<string, string>();
  const storeProductCounts = new Map<string, number>();

  const productsToInsert: any[] = [];
  const validRawProducts: typeof rawProducts = [];

  for (const raw of rawProducts) {
    const storeId = storeMap.get(raw.storeSlug);
    if (!storeId) {
      console.warn(`Store ${raw.storeSlug} not found for product ${raw.name}. Skipping.`);
      continue;
    }

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - 20); // 20 days ago

    productsToInsert.push({
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
    });
    validRawProducts.push(raw);
  }

  if (productsToInsert.length > 0) {
    const insertedProducts = await tx.insert(products).values(productsToInsert).returning();

    for (let i = 0; i < insertedProducts.length; i++) {
      const inserted = insertedProducts[i];
      const raw = validRawProducts[i];
      productMap.set(raw.slug, inserted.id);

      // Track total products per store
      const currentCount = storeProductCounts.get(inserted.storeId) || 0;
      storeProductCounts.set(inserted.storeId, currentCount + 1);
    }
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

  console.log(`Seeded ${productsToInsert.length} products successfully.`);
  return productMap;
}
