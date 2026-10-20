import type { ClientSession } from 'mongodb';
import { collections, type StoreDoc } from '@/db';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const caseInsensitive = { locale: 'en', strength: 2 } as const;

/** API shape of a store (Mongo keeps the id in `_id`). */
export type Store = Omit<StoreDoc, '_id'> & { id: string };

export const toStore = ({ _id, ...rest }: StoreDoc): Store => ({ id: _id, ...rest });

export const StoresRepo = {
  bySeller: (sellerId: string) => collections.stores.findOne({ sellerId }),
  byId: (id: string) => collections.stores.findOne({ _id: id }),
  slugTaken: async (slug: string, exceptId?: string) =>
    (await collections.stores.countDocuments({
      slug,
      ...(exceptId ? { _id: { $ne: exceptId } } : {}),
    })) > 0,
  nameTaken: async (name: string, exceptId?: string) =>
    (await collections.stores.countDocuments(
      { name, ...(exceptId ? { _id: { $ne: exceptId } } : {}) },
      { collation: caseInsensitive },
    )) > 0,

  /** By UUID, slug, or (case-insensitive) name, in that order. */
  async findPublic(slugOrId: string) {
    if (UUID_RE.test(slugOrId)) {
      const byId = await collections.stores.findOne({ _id: slugOrId });
      if (byId) return byId;
    }
    return (
      (await collections.stores.findOne({ slug: slugOrId.toLowerCase() })) ??
      (await collections.stores.findOne({ name: slugOrId }, { collation: caseInsensitive }))
    );
  },

  async insert(store: StoreDoc, session: ClientSession) {
    await collections.stores.insertOne(store, { session });
    return store;
  },

  update(id: string, set: Partial<StoreDoc>, session: ClientSession) {
    return collections.stores.findOneAndUpdate(
      { _id: id },
      { $set: { ...set, updatedAt: new Date() }, $inc: { version: 1 } },
      { session, returnDocument: 'after' },
    );
  },
};
