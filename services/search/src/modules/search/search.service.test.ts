import { describe, expect, test } from 'bun:test';
import { buildProductQuery } from './search.service';

function filters(storeSlug?: string) {
  const scored = buildProductQuery({ q: 'tuna', storeSlug, page: 1, limit: 20 }).function_score;
  const query = scored && !Array.isArray(scored) ? scored.query : undefined;
  return [query?.bool?.filter ?? []].flat();
}

describe('product search query', () => {
  test('deleted products (tombstones) never match', () => {
    expect(filters()).toContainEqual({ term: { deleted: false } });
  });

  test('a store can be given by slug or by id', () => {
    expect(filters('Toko-Laut')).toContainEqual({ term: { storeSlug: 'toko-laut' } });
    expect(filters('00000000-0000-4000-8000-0000000000aa')).toContainEqual({
      term: { storeId: '00000000-0000-4000-8000-0000000000aa' },
    });
  });
});
