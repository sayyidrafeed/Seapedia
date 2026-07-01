import { db } from '@/db';
import { products, stores } from '@/db/schema';
import { eq, and, ilike, or, sql } from 'drizzle-orm';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { StoreService } from '@/modules/stores/stores.service';
import { StorageService } from '@/lib/storage';

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
      stock: number;
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
    if (input.stock < 0) {
      throw new ValidationError('Stock cannot be negative');
    }

    const slug = await ProductsService.getUniqueProductSlug(store.id, input.name);

    const [product] = await db
      .insert(products)
      .values({
        storeId: store.id,
        name: input.name,
        slug,
        description: input.description,
        price: input.price,
        stock: input.stock,
        imageKey: input.imageKey || null,
      })
      .returning();

    await db
      .update(stores)
      .set({ totalProducts: sql`${stores.totalProducts} + 1` })
      .where(eq(stores.id, store.id));

    return product;
  }

  static async getSellerProducts(sellerId: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = options ?? {};
    const offset = (page - 1) * limit;

    const store = await StoreService.getBySellerId(sellerId);
    if (!store) {
      return { products: [], total: 0 };
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.storeId, store.id));
    const total = Number(countResult[0]?.count ?? 0);

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
      stock?: number;
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
    if (input.stock !== undefined && input.stock < 0) {
      throw new ValidationError('Stock cannot be negative');
    }

    let slug = product.slug;
    if (input.name && input.name !== product.name) {
      slug = await ProductsService.getUniqueProductSlug(store.id, input.name, productId);
    }

    const oldImageKey = product.imageKey;

    const [updatedProduct] = await db
      .update(products)
      .set({
        name: input.name ?? product.name,
        slug,
        description: input.description !== undefined ? input.description : product.description,
        price: input.price ?? product.price,
        stock: input.stock ?? product.stock,
        imageKey: input.imageKey !== undefined ? input.imageKey : product.imageKey,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

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

    await db.delete(products).where(eq(products.id, productId));
    await db
      .update(stores)
      .set({ totalProducts: sql`${stores.totalProducts} - 1` })
      .where(eq(stores.id, store.id));

    if (product.imageKey) {
      await StorageService.deleteObject(product.imageKey);
    }
    return { success: true };
  }

  static async getPublicProducts(options: {
    search?: string;
    storeSlug?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, storeSlug, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(ilike(products.name, `%${search}%`), ilike(products.description, `%${search}%`)),
      );
    }

    if (storeSlug) {
      // Allow searching by either store slug or store UUID
      if (
        storeSlug.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        )
      ) {
        conditions.push(eq(stores.id, storeSlug));
      } else {
        conditions.push(eq(stores.slug, storeSlug.toLowerCase()));
      }
    }

    const whereCond = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(whereCond);
    const total = Number(countResult[0]?.count ?? 0);

    const results = await db
      .select({
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
      })
      .from(products)
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(whereCond)
      .limit(limit)
      .offset(offset);

    return { products: results, total };
  }

  static async getPublicProductBySlug(storeSlug: string, productSlug: string) {
    // Find the store first
    let storeCond = eq(stores.slug, storeSlug.toLowerCase());
    if (
      storeSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    ) {
      storeCond = eq(stores.id, storeSlug);
    }

    const result = await db
      .select({
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
      })
      .from(products)
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(and(storeCond, eq(products.slug, productSlug.toLowerCase())))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundError('Product not found');
    }

    return result[0];
  }

  static async getPublicProductById(id: string) {
    const result = await db
      .select({
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
      })
      .from(products)
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(eq(products.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundError('Product not found');
    }

    return result[0];
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
}
