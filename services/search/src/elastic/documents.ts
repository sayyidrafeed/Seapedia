import { z } from 'zod';

/** Product projection published by catalog (`/internal/search/documents`). */
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
