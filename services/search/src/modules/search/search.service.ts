import type { estypes } from '@elastic/elasticsearch';
import { elastic } from '@/elastic/client';
import { alias } from '@/elastic/indices';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ProductQuery = { q: string; storeSlug?: string; page: number; limit: number };

/** Builds the ranked product query. Exported for inspection; it has no side effects. */
export function buildProductQuery({ q, storeSlug }: ProductQuery): estypes.QueryDslQueryContainer {
  const filter: estypes.QueryDslQueryContainer[] = [];
  if (storeSlug) {
    filter.push(
      UUID_RE.test(storeSlug)
        ? { term: { storeId: storeSlug } }
        : { term: { storeSlug: storeSlug.toLowerCase() } },
    );
  }

  return {
    function_score: {
      query: {
        bool: {
          // Every query word must match. Names tolerate typos; descriptions must match exactly,
          // otherwise long descriptions drag in near-miss words from unrelated products.
          must: {
            bool: {
              should: [
                {
                  multi_match: {
                    query: q,
                    fields: ['name^3', 'storeName^1.5'],
                    fuzziness: 'AUTO',
                    prefix_length: 1,
                    operator: 'and',
                  },
                },
                { match: { description: { query: q, operator: 'and' } } },
              ],
              minimum_should_match: 1,
            },
          },
          filter,
        },
      },
      // Text relevance first; popularity and rating break ties without drowning it.
      functions: [
        { field_value_factor: { field: 'soldCount', modifier: 'log1p', factor: 0.1, missing: 0 } },
        { field_value_factor: { field: 'rating', modifier: 'log1p', factor: 0.5, missing: 0 } },
      ],
      score_mode: 'sum',
      boost_mode: 'sum',
    },
  };
}

export const SearchService = {
  /** Ranked product ids for a page of results, plus the total hit count. */
  async searchProducts(params: ProductQuery) {
    const result = await elastic.search({
      index: alias,
      query: buildProductQuery(params),
      from: (params.page - 1) * params.limit,
      size: params.limit,
      _source: false,
      track_total_hits: true,
    });
    const total =
      typeof result.hits.total === 'number' ? result.hits.total : (result.hits.total?.value ?? 0);
    return { ids: result.hits.hits.flatMap((hit) => hit._id ?? []), total };
  },
};
