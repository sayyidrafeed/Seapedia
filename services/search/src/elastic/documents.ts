import { z } from 'zod';

/** A product as search indexes it: no price or stock (catalog loads those for each result). */
export const productDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  rating: z.number(),
  reviewCount: z.number().int(),
  soldCount: z.number().int(),
  createdAt: z.string(),
  storeId: z.string(),
  storeName: z.string(),
  storeSlug: z.string(),
});

export type ProductDocument = z.infer<typeof productDocumentSchema>;

/** Stored form: the catalog version it came from, and a tombstone flag for deletions. */
export type IndexedProduct = ProductDocument & { version: number; deleted: boolean };
