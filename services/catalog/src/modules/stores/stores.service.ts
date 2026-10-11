import { db } from '@/db';
import { stores } from '@/db/schema';
import { eq, ilike, inArray } from 'drizzle-orm';
import { ConflictError, NotFoundError, ForbiddenError } from '@seapedia/platform/errors';
import { StorageService } from '@/lib/storage';
import { catalogOutbox } from '@/modules/events/events.index';

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
    let suffix = 1;
    while (true) {
      const existing = await db.query.stores.findFirst({
        where: (stores, { eq, ne, and }) => {
          const conds = [eq(stores.slug, slug)];
          if (excludeStoreId) {
            conds.push(ne(stores.id, excludeStoreId));
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

  static async create(
    userId: string,
    input: { name: string; description?: string; logoKey?: string | null },
  ) {
    const existingStore = await db.query.stores.findFirst({
      where: eq(stores.sellerId, userId),
    });

    if (existingStore) {
      throw new ConflictError('Seller already has a store');
    }

    const existingName = await db.query.stores.findFirst({
      where: ilike(stores.name, input.name),
    });

    if (existingName) {
      throw new ConflictError('Store name is already used');
    }

    const slug = await StoreService.getUniqueSlug(input.name);

    return await db.transaction(async (tx) => {
      const [newStore] = await tx
        .insert(stores)
        .values({
          sellerId: userId,
          name: input.name,
          slug,
          description: input.description,
          logoKey: input.logoKey || null,
        })
        .returning();

      await catalogOutbox.enqueue(tx, 'store', [newStore.id]);
      return newStore;
    });
  }

  static async getBySellerId(userId: string) {
    const store = await db.query.stores.findFirst({
      where: eq(stores.sellerId, userId),
    });

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    return store;
  }

  static async update(
    userId: string,
    input: { name?: string; description?: string; logoKey?: string | null },
  ) {
    const store = await db.query.stores.findFirst({
      where: eq(stores.sellerId, userId),
    });

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    let slug = store.slug;
    if (input.name && input.name !== store.name) {
      const existingName = await db.query.stores.findFirst({
        where: ilike(stores.name, input.name),
      });

      if (existingName) {
        throw new ConflictError('Store name is already used');
      }
      slug = await StoreService.getUniqueSlug(input.name, store.id);
    }

    const oldLogoKey = store.logoKey;

    const updatedStore = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(stores)
        .set({
          name: input.name ?? store.name,
          slug,
          description: input.description ?? store.description,
          logoKey: input.logoKey !== undefined ? input.logoKey : store.logoKey,
          updatedAt: new Date(),
        })
        .where(eq(stores.id, store.id))
        .returning();

      await catalogOutbox.enqueue(tx, 'store', [store.id]);
      return updated;
    });

    if (input.logoKey !== undefined && oldLogoKey && oldLogoKey !== input.logoKey) {
      await StorageService.deleteObject(oldLogoKey);
    }

    return updatedStore;
  }

  /**
   * Generates pre-signed URL for store logo upload
   */
  static async presignLogo(userId: string, storeId: string, mimeType: string) {
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
    });

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    if (store.sellerId !== userId) {
      throw new ForbiddenError('You do not own this store');
    }

    return await StorageService.generatePresignedUpload('stores/logos', mimeType);
  }

  static async getPublic(slugOrId: string) {
    let store;

    if (
      slugOrId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    ) {
      store = await db.query.stores.findFirst({
        where: eq(stores.id, slugOrId),
      });
    }

    if (!store) {
      store = await db.query.stores.findFirst({
        where: eq(stores.slug, slugOrId.toLowerCase()),
      });
    }

    if (!store) {
      store = await db.query.stores.findFirst({
        where: ilike(stores.name, slugOrId),
      });
    }

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    return store;
  }

  /** Minimal store fields other services replicate. Missing ids are simply absent. */
  static async getStoreRefs(ids: string[]) {
    if (ids.length === 0) return [];
    return await db
      .select({ id: stores.id, sellerId: stores.sellerId, name: stores.name, slug: stores.slug })
      .from(stores)
      .where(inArray(stores.id, ids));
  }
}
