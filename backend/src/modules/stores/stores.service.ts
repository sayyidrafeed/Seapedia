import { db } from '@/db';
import { stores } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ConflictError, NotFoundError } from '@/lib/errors';

export class StoreService {
  static async create(userId: string, input: { name: string; description?: string }) {
    const existingStore = await db.query.stores.findFirst({
      where: eq(stores.sellerId, userId),
    });

    if (existingStore) {
      throw new ConflictError('Seller already has a store');
    }

    const existingName = await db.query.stores.findFirst({
      where: eq(stores.name, input.name),
    });

    if (existingName) {
      throw new ConflictError('Store name is already used');
    }

    const [newStore] = await db
      .insert(stores)
      .values({
        sellerId: userId,
        name: input.name,
        description: input.description,
      })
      .returning();

    return newStore;
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

  static async update(userId: string, input: { name?: string; description?: string }) {
    const store = await db.query.stores.findFirst({
      where: eq(stores.sellerId, userId),
    });

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    if (input.name && input.name !== store.name) {
      const existingName = await db.query.stores.findFirst({
        where: eq(stores.name, input.name),
      });

      if (existingName) {
        throw new ConflictError('Store name is already used');
      }
    }

    const [updatedStore] = await db
      .update(stores)
      .set({
        name: input.name ?? store.name,
        description: input.description ?? store.description,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, store.id))
      .returning();

    return updatedStore;
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
        where: eq(stores.name, slugOrId),
      });
    }

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    return store;
  }
}
