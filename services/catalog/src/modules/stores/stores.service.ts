import { ConflictError, ForbiddenError, NotFoundError } from '@seapedia/platform/errors';
import { inTransaction } from '@/db';
import { StorageService } from '@/lib/storage';
import { CatalogEvents, enqueue } from '@/modules/events/events.index';
import { StoresRepo, toStore } from './stores.repo';

export class StoreService {
  static slugify(text: string) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/-+/g, '-'); // Replace multiple - with single -
  }

  static async getUniqueSlug(name: string, excludeStoreId?: string): Promise<string> {
    const baseSlug = StoreService.slugify(name);
    let slug = baseSlug;
    for (let suffix = 1; await StoresRepo.slugTaken(slug, excludeStoreId); suffix++) {
      slug = `${baseSlug}-${suffix}`;
    }
    return slug;
  }

  static async create(
    userId: string,
    input: { name: string; description?: string; logoKey?: string | null },
  ) {
    if (await StoresRepo.bySeller(userId)) {
      throw new ConflictError('Seller already has a store');
    }
    if (await StoresRepo.nameTaken(input.name)) {
      throw new ConflictError('Store name is already used');
    }

    const slug = await StoreService.getUniqueSlug(input.name);
    const now = new Date();
    const store = await inTransaction(async (session) => {
      const created = await StoresRepo.insert(
        {
          _id: crypto.randomUUID(),
          sellerId: userId,
          name: input.name,
          slug,
          description: input.description ?? null,
          logoKey: input.logoKey || null,
          rating: 0,
          reviewCount: 0,
          totalProducts: 0,
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
        session,
      );
      await enqueue(session, CatalogEvents.storeUpserted(created));
      return created;
    });
    return toStore(store);
  }

  static async getBySellerId(userId: string) {
    const store = await StoresRepo.bySeller(userId);
    if (!store) {
      throw new NotFoundError('Store not found');
    }
    return toStore(store);
  }

  static async update(
    userId: string,
    input: { name?: string; description?: string; logoKey?: string | null },
  ) {
    const store = await StoresRepo.bySeller(userId);
    if (!store) {
      throw new NotFoundError('Store not found');
    }

    let slug = store.slug;
    if (input.name && input.name !== store.name) {
      if (await StoresRepo.nameTaken(input.name, store._id)) {
        throw new ConflictError('Store name is already used');
      }
      slug = await StoreService.getUniqueSlug(input.name, store._id);
    }

    const updated = await inTransaction(async (session) => {
      const doc = await StoresRepo.update(
        store._id,
        {
          name: input.name ?? store.name,
          slug,
          description: input.description ?? store.description,
          logoKey: input.logoKey !== undefined ? input.logoKey : store.logoKey,
        },
        session,
      );
      if (!doc) throw new NotFoundError('Store not found');
      await enqueue(session, CatalogEvents.storeUpserted(doc));
      return doc;
    });

    if (input.logoKey !== undefined && store.logoKey && store.logoKey !== input.logoKey) {
      await StorageService.deleteObject(store.logoKey);
    }
    return toStore(updated);
  }

  /**
   * Generates pre-signed URL for store logo upload
   */
  static async presignLogo(userId: string, storeId: string, mimeType: string) {
    const store = await StoresRepo.byId(storeId);
    if (!store) {
      throw new NotFoundError('Store not found');
    }
    if (store.sellerId !== userId) {
      throw new ForbiddenError('You do not own this store');
    }
    return await StorageService.generatePresignedUpload('stores/logos', mimeType);
  }

  static async getPublic(slugOrId: string) {
    const store = await StoresRepo.findPublic(slugOrId);
    if (!store) {
      throw new NotFoundError('Store not found');
    }
    return toStore(store);
  }
}
