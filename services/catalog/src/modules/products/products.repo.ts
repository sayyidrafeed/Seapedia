import type { ClientSession, Filter } from 'mongodb';
import { collections, type ProductDoc } from '@/db';

const rating = (value: number) => value.toFixed(2);
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Products joined with their store, in the public API shape (ratings as "4.50" strings). */
function publicStages(): object[] {
  return [
    { $lookup: { from: 'stores', localField: 'storeId', foreignField: '_id', as: 'store' } },
    { $unwind: '$store' },
    {
      $project: {
        _id: 0,
        id: '$_id',
        name: 1,
        description: 1,
        price: 1,
        stock: 1,
        storeId: 1,
        storeName: '$store.name',
        storeSlug: '$store.slug',
        slug: 1,
        imageKey: 1,
        rating: 1,
        reviewCount: 1,
        soldCount: 1,
        storeRating: '$store.rating',
        storeReviewCount: '$store.reviewCount',
        storeLogoKey: '$store.logoKey',
        storeTotalProducts: '$store.totalProducts',
      },
    },
  ];
}

type PublicRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  storeId: string;
  storeName: string;
  storeSlug: string;
  slug: string;
  imageKey: string | null;
  rating: number;
  reviewCount: number;
  soldCount: number;
  storeRating: number;
  storeReviewCount: number;
  storeLogoKey: string | null;
  storeTotalProducts: number;
};

const formatPublic = (row: PublicRow) => ({
  ...row,
  rating: rating(row.rating),
  storeRating: rating(row.storeRating),
});

export type PublicProduct = ReturnType<typeof formatPublic>;

/** API shape of a product as its seller sees it. */
export const toSellerProduct = ({ _id, ...rest }: ProductDoc) => ({
  id: _id,
  ...rest,
  rating: rating(rest.rating),
});

export const ProductsRepo = {
  textFilter(search: string): Filter<ProductDoc> {
    const pattern = { $regex: escapeRegex(search), $options: 'i' };
    return { $or: [{ name: pattern }, { description: pattern }] };
  },

  async listPublic(filter: Filter<ProductDoc>, page: number, limit: number) {
    const [total, rows] = await Promise.all([
      collections.products.countDocuments(filter),
      collections.products
        .aggregate<PublicRow>([
          { $match: filter },
          { $sort: { createdAt: -1, _id: 1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          ...publicStages(),
        ])
        .toArray(),
    ]);
    return { products: rows.map(formatPublic), total };
  },

  async publicOne(filter: Filter<ProductDoc>) {
    const [row] = await collections.products
      .aggregate<PublicRow>([{ $match: filter }, { $limit: 1 }, ...publicStages()])
      .toArray();
    return row ? formatPublic(row) : null;
  },

  /** Loads products by id, keeping the given (ranked) order; missing ids are dropped. */
  async publicInOrder(ids: string[]) {
    if (ids.length === 0) return [];
    const rows = await collections.products
      .aggregate<PublicRow>([{ $match: { _id: { $in: ids } } }, ...publicStages()])
      .toArray();
    const byId = new Map(rows.map((r) => [r.id, formatPublic(r)]));
    return ids.flatMap((id) => byId.get(id) ?? []);
  },

  bySeller: (storeId: string, page: number, limit: number) =>
    Promise.all([
      collections.products.countDocuments({ storeId }),
      collections.products
        .find({ storeId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
    ]),

  owned: (storeId: string, productId: string) =>
    collections.products.findOne({ _id: productId, storeId }),

  slugTaken: async (storeId: string, slug: string, exceptId?: string) =>
    (await collections.products.countDocuments({
      storeId,
      slug,
      ...(exceptId ? { _id: { $ne: exceptId } } : {}),
    })) > 0,

  async insert(product: ProductDoc, session: ClientSession) {
    await collections.products.insertOne(product, { session });
    return product;
  },

  update(id: string, set: Partial<ProductDoc>, session: ClientSession) {
    return collections.products.findOneAndUpdate(
      { _id: id },
      { $set: { ...set, updatedAt: new Date() }, $inc: { version: 1 } },
      { session, returnDocument: 'after' },
    );
  },

  remove: (id: string, session: ClientSession) =>
    collections.products.deleteOne({ _id: id }, { session }),

  adjustStoreProductCount: (storeId: string, delta: number, session: ClientSession) =>
    collections.stores.findOneAndUpdate(
      { _id: storeId },
      { $inc: { totalProducts: delta, version: 1 }, $set: { updatedAt: new Date() } },
      { session, returnDocument: 'after' },
    ),

  /** Keyset page of the search projection (no price or stock), for full reindexes. */
  async exportPage(after: string | undefined, limit: number) {
    const rows = await collections.products
      .aggregate<{
        id: string;
        name: string;
        description: string | null;
        slug: string;
        rating: number;
        reviewCount: number;
        soldCount: number;
        createdAt: Date;
        storeId: string;
        storeName: string;
        storeSlug: string;
      }>([
        { $match: after ? { _id: { $gt: after } } : {} },
        { $sort: { _id: 1 } },
        { $limit: limit },
        { $lookup: { from: 'stores', localField: 'storeId', foreignField: '_id', as: 'store' } },
        { $unwind: '$store' },
        {
          $project: {
            _id: 0,
            id: '$_id',
            name: 1,
            description: 1,
            slug: 1,
            rating: 1,
            reviewCount: 1,
            soldCount: 1,
            createdAt: 1,
            storeId: 1,
            storeName: '$store.name',
            storeSlug: '$store.slug',
          },
        },
      ])
      .toArray();
    return {
      documents: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      next: rows.length === limit ? rows[rows.length - 1].id : null,
    };
  },
};
