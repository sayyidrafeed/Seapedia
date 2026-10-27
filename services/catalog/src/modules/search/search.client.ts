import { createInternalClient } from '@seapedia/platform/internal-client';
import { z } from 'zod';
import { config } from '@/config';
import { runtime } from '@/runtime';

const searchResultSchema = z.object({ ids: z.array(z.string()), total: z.number().int() });

const searchClient = createInternalClient({
  service: 'search',
  resolver: runtime.resolver,
  tokens: runtime.tokens,
  scope: 'search:query',
});

// Null when search is switched off or too slow; callers then query MongoDB instead.
export async function searchProductIds(params: {
  q: string;
  storeSlug?: string;
  page: number;
  limit: number;
}): Promise<z.infer<typeof searchResultSchema> | null> {
  const { searchEnabled, searchTimeoutMs } = config.get();
  if (!searchEnabled) return null;
  try {
    return await searchClient.get('/search/products', searchResultSchema, params, {
      timeoutMs: searchTimeoutMs,
    });
  } catch (error) {
    console.warn(JSON.stringify({ event: 'search_fallback', error: String(error) }));
    return null;
  }
}
