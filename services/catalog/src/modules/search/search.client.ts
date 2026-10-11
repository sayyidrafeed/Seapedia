import { z } from 'zod';
import { searchClient } from '@/modules/clients/clients.index';

const searchResultSchema = z.object({ ids: z.array(z.string()), total: z.number().int() });

/**
 * Ranked product ids from the search service, or `null` when search is not configured or not
 * answering in time. Callers fall back to the database query on `null`.
 */
export async function searchProductIds(params: {
  q: string;
  storeSlug?: string;
  page: number;
  limit: number;
}): Promise<z.infer<typeof searchResultSchema> | null> {
  if (!searchClient) return null;
  try {
    return await searchClient.get('/search/products', searchResultSchema, params);
  } catch (error) {
    console.warn(JSON.stringify({ event: 'search_fallback', error: String(error) }));
    return null;
  }
}
