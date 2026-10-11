import { db } from '@/db';
import { products, stores } from '@/db/schema';
import { eq, and, ilike, inArray, or, sql, count, type SQL } from 'drizzle-orm';
import { ForbiddenError, NotFoundError, ValidationError } from '@seapedia/platform/errors';
import { StoreService } from '@/modules/stores/stores.service';
import { StorageService } from '@/lib/storage';
import { catalogOutbox } from '@/modules/events/events.index';
import { searchProductIds } from '@/modules/search/search.index';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Public product shape: product joined with its store. `stock` is commerce's inventory read model. */
const publicProductColumns = {
  id: products.id,
  name: products.name,
  description: products.description,
  price: products.price,
  stock: products.stock,
  storeId: products.storeId,
  storeName: stores.name,
  storeSlug: stores.slug,
  slug: products.slug,
  imageKey: products.imageKey,
  rating: products.rating,
  reviewCount: products.reviewCount,
  soldCount: products.soldCount,
  storeRating: stores.rating,
  storeReviewCount: stores.reviewCount,
  storeLogoKey: stores.logoKey,
  storeTotalProducts: stores.totalProducts,
};

export class ProductsService {
  static slugify(text: string) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/-+/g, '-');
  }

  static async getUniqueProductSlug(
    storeId: string,
    name: string,
    excludeProductId?: string,
  ): Promise<string> {
    const baseSlug = ProductsService.slugify(name);
    let slug = baseSlug;
    let suffix = 1;
    while (true) {
      const existing = await db.query.products.findFirst({
        where: (products, { eq, ne, and }) => {
          const conds = [eq(products.storeId, storeId), eq(products.slug, slug)];
          if (excludeProductId) {
            conds.push(ne(products.id, excludeProductId));
          }
          return and(...conds);
        },
      });
      if (!existing) {
        break;
      }
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }
    return slug;
  }

  static async createSellerProduct(
    sellerId: string,
    input: {
      name: string;
      description?: string | null;
      price: number;
      imageKey?: string | null;
    },
  ) {
    const store = await StoreService.getBySellerId(sellerId);
    if (!store) {
      throw new ForbiddenError('You must have a store to create products');
    }

    if (input.price < 0) {
      throw new ValidationError('Price cannot be negative');
    }

    const slug = await ProductsService.getUniqueProductSlug(store.id, input.name);

    return await db.transaction(async (tx) => {
      const [product] = await tx
        .insert(products)
        .values({
          storeId: store.id,
          name: input.name,
          slug,
          description: input.description,
          price: input.price,
          imageKey: input.imageKey || null,
        })
        .returning();

      await tx
        .update(stores)
        .set({ totalProducts: sql`${stores.totalProducts} + 1` })
        .where(eq(stores.id, store.id));

      await catalogOutbox.enqueue(tx, 'product', [product.id]);
      return product;
    });
  }

  static async getSellerProducts(sellerId: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = options ?? {};
    const offset = (page - 1) * limit;

    const store = await StoreService.getBySellerId(sellerId);
    if (!store) {
      return { products: [], total: 0 };
    }

    const countResult = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.storeId, store.id));
    const total = countResult[0]?.count ?? 0;

    const results = await db.query.products.findMany({
      where: eq(products.storeId, store.id),
      limit,
      offset,
    });

    return { products: results, total };
  }

  static async getSellerProductById(sellerId: string, productId: string) {
    const store = await StoreService.getBySellerId(sellerId);
    if (!store) {
      throw new ForbiddenError('You must have a store to view products');
    }

    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.storeId, store.id)),
    });

    if (!product) {
      throw new NotFoundError('Product not found or does not belong to your store');
    }

    return product;
  }

  static async updateSellerProduct(
    sellerId: string,
    productId: string,
    input: {
      name?: string;
      description?: string | null;
      price?: number;
      imageKey?: string | null;
    },
  ) {
    const store = await StoreService.getBySellerId(sellerId);
    if (!store) {
      throw new ForbiddenError('You must have a store to manage products');
    }

    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.storeId, store.id)),
    });

    if (!product) {
      throw new NotFoundError('Product not found or does not belong to your store');
    }

    if (input.price !== undefined && input.price < 0) {
      throw new ValidationError('Price cannot be negative');
    }

    let slug = product.slug;
    if (input.name && input.name !== product.name) {
      slug = await ProductsService.getUniqueProductSlug(store.id, input.name, productId);
    }

    const oldImageKey = product.imageKey;

    const updatedProduct = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(products)
        .set({
          name: input.name ?? product.name,
          slug,
          description: input.description !== undefined ? input.description : product.description,
          price: input.price ?? product.price,
          imageKey: input.imageKey !== undefined ? input.imageKey : product.imageKey,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId))
        .returning();

      await catalogOutbox.enqueue(tx, 'product', [productId]);
      return updated;
    });

    if (input.imageKey !== undefined && oldImageKey && oldImageKey !== input.imageKey) {
      await StorageService.deleteObject(oldImageKey);
    }

    return updatedProduct;
  }

  static async deleteSellerProduct(sellerId: string, productId: string) {
    const store = await StoreService.getBySellerId(sellerId);
    if (!store) {
      throw new ForbiddenError('You must have a store to manage products');
    }

    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.storeId, store.id)),
    });

    if (!product) {
      throw new NotFoundError('Product not found or does not belong to your store');
    }

    await db.transaction(async (tx) => {
      await tx.delete(products).where(eq(products.id, productId));
      await tx
        .update(stores)
        .set({ totalProducts: sql`${stores.totalProducts} - 1` })
        .where(eq(stores.id, store.id));
      await catalogOutbox.enqueue(tx, 'product', [productId]);
    });

    if (product.imageKey) {
      await StorageService.deleteObject(product.imageKey);
    }
    return { success: true };
  }

  /**
   * Public catalog listing. Free-text queries go to the search service (ranked ids), then rows are
   * hydrated here so price and stock always come from the source of truth. If search is not
   * configured or fails, the same query runs as an ILIKE scan so the catalog stays available.
   */
  static async getPublicProducts(options: {
    search?: string;
    storeSlug?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, storeSlug, page = 1, limit = 20 } = options;

    if (search) {
      const hits = await searchProductIds({ q: search, storeSlug, page, limit });
      if (hits) {
        return { products: await ProductsService.hydrateInOrder(hits.ids), total: hits.total };
      }
    }

    return await ProductsService.queryProducts({ search, storeSlug, page, limit });
  }

  /** Loads public products by id, preserving the given (ranked) order. Missing ids are dropped. */
  static async hydrateInOrder(ids: string[]) {
    if (ids.length === 0) return [];
    const rows = await db
      .select(publicProductColumns)
      .from(products)
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(inArray(products.id, ids));
    const byId = new Map(rows.map((r) => [r.id, r]));
    return ids.flatMap((id) => byId.get(id) ?? []);
  }

  static async queryProducts(options: {
    search?: string;
    storeSlug?: string;
    page: number;
    limit: number;
  }) {
    const { search, storeSlug, page, limit } = options;
    const conditions: SQL[] = [];

    if (search) {
      conditions.push(
        or(ilike(products.name, `%${search}%`), ilike(products.description, `%${search}%`))!,
      );
    }

    if (storeSlug) {
      // Allow searching by either store slug or store UUID
      conditions.push(
        UUID_RE.test(storeSlug)
          ? eq(stores.id, storeSlug)
          : eq(stores.slug, storeSlug.toLowerCase()),
      );
    }

    const whereCond = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: count() })
      .from(products)
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(whereCond);
    const total = countResult[0]?.count ?? 0;

    const results = await db
      .select(publicProductColumns)
      .from(products)
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(whereCond)
      .limit(limit)
      .offset((page - 1) * limit);

    return { products: results, total };
  }

  static async getPublicProductBySlug(storeSlug: string, productSlug: string) {
    const storeCond = UUID_RE.test(storeSlug)
      ? eq(stores.id, storeSlug)
      : eq(stores.slug, storeSlug.toLowerCase());

    const [result] = await db
      .select(publicProductColumns)
      .from(products)
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(and(storeCond, eq(products.slug, productSlug.toLowerCase())))
      .limit(1);

    if (!result) {
      throw new NotFoundError('Product not found');
    }

    return result;
  }

  static async getPublicProductById(id: string) {
    const [result] = await db
      .select(publicProductColumns)
      .from(products)
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(eq(products.id, id))
      .limit(1);

    if (!result) {
      throw new NotFoundError('Product not found');
    }

    return result;
  }

  /**
   * Generates pre-signed URL for seller product image upload
   */
  static async presignImage(sellerId: string, mimeType: string) {
    const store = await StoreService.getBySellerId(sellerId);
    if (!store) {
      throw new ForbiddenError('You must have a store to upload images');
    }

    return await StorageService.generatePresignedUpload('products/images', mimeType);
  }

  /** Minimal product fields commerce replicates for cart and checkout. Deleted ids are absent. */
  static async getProductRefs(ids: string[]) {
    if (ids.length === 0) return [];
    return await db
      .select({
        id: products.id,
        storeId: products.storeId,
        name: products.name,
        slug: products.slug,
        price: products.price,
        imageKey: products.imageKey,
      })
      .from(products)
      .where(inArray(products.id, ids));
  }

  /** Counts for the admin dashboard. */
  static async getStats() {
    const [[storeCount], [productCount]] = await Promise.all([
      db.select({ count: count() }).from(stores),
      db.select({ count: count() }).from(products),
    ]);
    return { stores: storeCount?.count ?? 0, products: productCount?.count ?? 0 };
  }

  /** Applies commerce's inventory to the display read model. */
  static async applyStock(items: { productId: string; stock: number }[]) {
    for (const item of items) {
      await db.update(products).set({ stock: item.stock }).where(eq(products.id, item.productId));
    }
  }

  /** Applies commerce's sold counts; they rank search results, so search is notified. */
  static async applySoldCounts(items: { productId: string; soldCount: number }[]) {
    if (items.length === 0) return;
    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(products)
          .set({ soldCount: item.soldCount })
          .where(eq(products.id, item.productId));
      }
      await catalogOutbox.enqueue(
        tx,
        'product',
        items.map((i) => i.productId),
      );
    });
  }
}
