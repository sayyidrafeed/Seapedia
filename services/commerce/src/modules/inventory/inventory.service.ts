import { and, eq, inArray } from 'drizzle-orm';
import { ForbiddenError, NotFoundError } from '@seapedia/platform/errors';
import { db } from '@/db';
import { inventory, productRefs, storeRefs } from '@/db/schema';
import { CatalogRefs } from '@/modules/catalog-sync/catalog-sync.index';
import { commerceOutbox } from '@/modules/events/events.index';

export class InventoryService {
  /** Sets a product's stock. Only the seller who owns the product's store may do this. */
  static async setStock(sellerId: string, productId: string, stock: number) {
    if (!(await CatalogRefs.ensureProduct(productId))) {
      throw new NotFoundError('Product not found');
    }

    const [owned] = await db
      .select({ productId: productRefs.id })
      .from(productRefs)
      .innerJoin(storeRefs, eq(storeRefs.id, productRefs.storeId))
      .where(and(eq(productRefs.id, productId), eq(storeRefs.sellerId, sellerId)))
      .limit(1);
    if (!owned) {
      throw new ForbiddenError('Product does not belong to your store');
    }

    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(inventory)
        .values({ productId, stock })
        .onConflictDoUpdate({ target: inventory.productId, set: { stock, updatedAt: new Date() } })
        .returning({ productId: inventory.productId, stock: inventory.stock });
      await commerceOutbox.enqueue(tx, 'inventory', [productId]);
      return row;
    });
  }

  static async getStock(productIds: string[]) {
    if (productIds.length === 0) return [];
    return await db
      .select({ productId: inventory.productId, stock: inventory.stock })
      .from(inventory)
      .where(inArray(inventory.productId, productIds));
  }
}
