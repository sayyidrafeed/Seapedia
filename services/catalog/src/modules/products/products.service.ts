import { ForbiddenError, NotFoundError, ValidationError } from '@seapedia/platform/errors';
import type { Filter } from 'mongodb';
import { inTransaction, type ProductDoc } from '@/db';
import { StorageService } from '@/lib/storage';
import { CatalogEvents, enqueue } from '@/modules/events/events.index';
import { searchProductIds } from '@/modules/search/search.index';
import { StoresRepo } from '@/modules/stores/stores.repo';
import { StoreService } from '@/modules/stores/stores.service';
import { ProductsRepo, toSellerProduct } from './products.repo';

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

  static async getUniqueProductSlug(storeId: string, name: string, excludeProductId?: string) {
    const baseSlug = ProductsService.slugify(name);
    let slug = baseSlug;
    for (let suffix = 1; await ProductsRepo.slugTaken(storeId, slug, excludeProductId); suffix++) {
      slug = `${baseSlug}-${suffix}`;
    }
    return slug;
  }

  static async createSellerProduct(
    sellerId: string,
    input: { name: string; description?: string | null; price: number; imageKey?: string | null },
  ) {
    const store = await StoreService.getBySellerId(sellerId);

    if (input.price < 0) {
      throw new ValidationError('Price cannot be negative');
    }

    const slug = await ProductsService.getUniqueProductSlug(store.id, input.name);
    const now = new Date();

    const product = await inTransaction(async (session) => {
      const created = await ProductsRepo.insert(
        {
          _id: crypto.randomUUID(),
          storeId: store.id,
          name: input.name,
          slug,
          description: input.description ?? null,
          price: input.price,
          imageKey: input.imageKey || null,
          rating: 0,
          reviewCount: 0,
          soldCount: 0,
          stock: 0,
          stockVersion: 0,
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
        session,
      );
      const updatedStore = await ProductsRepo.adjustStoreProductCount(store.id, 1, session);
      await enqueue(session, CatalogEvents.productUpserted(created));
      if (updatedStore) await enqueue(session, CatalogEvents.storeUpserted(updatedStore));
      return created;
    });
    return toSellerProduct(product);
  }

  static async getSellerProducts(sellerId: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = options ?? {};
    const store = await StoresRepo.bySeller(sellerId);
    if (!store) {
      return { products: [], total: 0 };
    }
    const [total, docs] = await ProductsRepo.bySeller(store._id, page, limit);
    return { products: docs.map(toSellerProduct), total };
  }

  static async getSellerProductById(sellerId: string, productId: string) {
    const store = await StoreService.getBySellerId(sellerId);
    const product = await ProductsRepo.owned(store.id, productId);
    if (!product) {
      throw new NotFoundError('Product not found or does not belong to your store');
    }
    return toSellerProduct(product);
  }

  static async updateSellerProduct(
    sellerId: string,
    productId: string,
    input: { name?: string; description?: string | null; price?: number; imageKey?: string | null },
  ) {
    const store = await StoreService.getBySellerId(sellerId);
    const product = await ProductsRepo.owned(store.id, productId);
    if (!product) {
      throw new NotFoundError('Product not found or does not belong to your store');
    }

    if (input.price !== undefined && input.price < 0) {
      throw new ValidationError('Price cannot be negative');
    }

    const slug =
      input.name && input.name !== product.name
        ? await ProductsService.getUniqueProductSlug(store.id, input.name, productId)
        : product.slug;

    const updated = await inTransaction(async (session) => {
      const doc = await ProductsRepo.update(
        productId,
        {
          name: input.name ?? product.name,
          slug,
          description: input.description !== undefined ? input.description : product.description,
          price: input.price ?? product.price,
          imageKey: input.imageKey !== undefined ? input.imageKey : product.imageKey,
        },
        session,
      );
      if (!doc) throw new NotFoundError('Product not found or does not belong to your store');
      await enqueue(session, CatalogEvents.productUpserted(doc));
      return doc;
    });

    if (input.imageKey !== undefined && product.imageKey && product.imageKey !== input.imageKey) {
      await StorageService.deleteObject(product.imageKey);
    }
    return toSellerProduct(updated);
  }

  static async deleteSellerProduct(sellerId: string, productId: string) {
    const store = await StoreService.getBySellerId(sellerId);
    const product = await ProductsRepo.owned(store.id, productId);
    if (!product) {
      throw new NotFoundError('Product not found or does not belong to your store');
    }

    await inTransaction(async (session) => {
      await ProductsRepo.remove(productId, session);
      const updatedStore = await ProductsRepo.adjustStoreProductCount(store.id, -1, session);
      await enqueue(session, CatalogEvents.productDeleted(product));
      if (updatedStore) await enqueue(session, CatalogEvents.storeUpserted(updatedStore));
    });

    if (product.imageKey) {
      await StorageService.deleteObject(product.imageKey);
    }
    return { success: true };
  }

  // Search ranks, catalog loads the rows, so price and stock in results are never stale.
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
        return { products: await ProductsRepo.publicInOrder(hits.ids), total: hits.total };
      }
    }

    const filter: Filter<ProductDoc> = search ? ProductsRepo.textFilter(search) : {};
    if (storeSlug) {
      const store = await StoresRepo.findPublic(storeSlug);
      if (!store) return { products: [], total: 0 };
      filter.storeId = store._id;
    }
    return await ProductsRepo.listPublic(filter, page, limit);
  }

  static async getPublicProductBySlug(storeSlug: string, productSlug: string) {
    const store = await StoresRepo.findPublic(storeSlug);
    const product = store
      ? await ProductsRepo.publicOne({ storeId: store._id, slug: productSlug.toLowerCase() })
      : null;
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  static async getPublicProductById(id: string) {
    const product = await ProductsRepo.publicOne({ _id: id });
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  /**
   * Generates pre-signed URL for seller product image upload
   */
  static async presignImage(sellerId: string, mimeType: string) {
    const store = await StoresRepo.bySeller(sellerId);
    if (!store) {
      throw new ForbiddenError('You must have a store to upload images');
    }
    return await StorageService.generatePresignedUpload('products/images', mimeType);
  }
}
