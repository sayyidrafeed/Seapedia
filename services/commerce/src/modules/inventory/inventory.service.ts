import { eq, inArray, sql } from 'drizzle-orm';
import { ConflictError, ForbiddenError, NotFoundError } from '@seapedia/platform/errors';
import { db } from '@/db';
import { inventory, pendingStock, productRefs, storeRefs } from '@/db/schema';
import { CommerceEvents, commerceOutbox } from '@/modules/events/events.index';

// A product created in catalog moments ago may not have replicated here yet (cart only).
export class ProductSyncingError extends ConflictError {
  constructor() {
    super('Product is still being synchronized, please retry in a moment', 'PRODUCT_SYNCING');
  }
}

export class InventoryService {
  // Sets a product's stock. Only the seller who owns the product's store may do this. A product
  // created moments ago may not have replicated yet: the stock is kept and applied on arrival.
  static async setStock(sellerId: string, productId: string, stock: number) {
    const [product] = await db
      .select({ deleted: productRefs.deleted, sellerId: storeRefs.sellerId })
      .from(productRefs)
      .innerJoin(storeRefs, eq(storeRefs.id, productRefs.storeId))
      .where(eq(productRefs.id, productId))
      .limit(1);
    if (!product) {
      await db
        .insert(pendingStock)
        .values({ productId, sellerId, stock })
        .onConflictDoUpdate({ target: pendingStock.productId, set: { sellerId, stock } });
      return { productId, stock, pending: true };
    }
    if (product.deleted) throw new NotFoundError('Product not found');
    if (product.sellerId !== sellerId) {
      throw new ForbiddenError('Product does not belong to your store');
    }

    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(inventory)
        .values({ productId, stock, version: 1 })
        .onConflictDoUpdate({
          target: inventory.productId,
          set: { stock, version: sql`${inventory.version} + 1`, updatedAt: new Date() },
        })
        .returning({
          productId: inventory.productId,
          stock: inventory.stock,
          version: inventory.version,
        });
      await commerceOutbox.enqueue(tx, CommerceEvents.inventoryChanged(row));
      return { productId: row.productId, stock: row.stock, pending: false };
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
