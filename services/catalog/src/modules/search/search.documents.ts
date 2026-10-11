import { asc, eq, gt, inArray, or, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { products, stores } from '@/db/schema';

/**
 * The search projection catalog publishes. Price and stock are deliberately absent: search ranks,
 * catalog hydrates, so those values are never stale in results.
 */
const documentColumns = {
  id: products.id,
  name: products.name,
  description: products.description,
  slug: products.slug,
  rating: products.rating,
  reviewCount: products.reviewCount,
  soldCount: products.soldCount,
  createdAt: products.createdAt,
  storeId: stores.id,
  storeName: stores.name,
  storeSlug: stores.slug,
};

function selectDocuments(where: SQL | undefined) {
  return db
    .select(documentColumns)
    .from(products)
    .innerJoin(stores, eq(products.storeId, stores.id))
    .where(where)
    .orderBy(asc(products.id));
}

type Row = Awaited<ReturnType<typeof selectDocuments>>[number];

function toDocument(row: Row) {
  return { ...row, rating: Number(row.rating), createdAt: row.createdAt.toISOString() };
}

export const SearchDocuments = {
  /** Current documents for the given products and for every product of the given stores. */
  async byIds(productIds: string[], storeIds: string[]) {
    const conditions: SQL[] = [];
    if (productIds.length > 0) conditions.push(inArray(products.id, productIds));
    if (storeIds.length > 0) conditions.push(inArray(products.storeId, storeIds));
    if (conditions.length === 0) return [];
    return (await selectDocuments(or(...conditions))).map(toDocument);
  },

  /** Keyset-paginated full export for reindexing. */
  async exportPage(after: string | undefined, limit: number) {
    const rows = await selectDocuments(after ? gt(products.id, after) : undefined).limit(limit);
    return {
      documents: rows.map(toDocument),
      next: rows.length === limit ? rows[rows.length - 1].id : null,
    };
  },
};
