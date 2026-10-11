import type { estypes } from '@elastic/elasticsearch';

/** Indonesian-language full text, with keyword sub-fields for exact filters. */
export const productIndexSettings: estypes.IndicesIndexSettings = {
  number_of_shards: 1,
  // Single node: replicas could never be allocated and would keep the cluster yellow.
  number_of_replicas: 0,
};

export const productMappings: estypes.MappingTypeMapping = {
  dynamic: 'strict',
  properties: {
    id: { type: 'keyword' },
    name: {
      type: 'text',
      analyzer: 'indonesian',
      fields: { raw: { type: 'keyword', ignore_above: 255 } },
    },
    description: { type: 'text', analyzer: 'indonesian' },
    slug: { type: 'keyword' },
    rating: { type: 'float' },
    reviewCount: { type: 'integer' },
    soldCount: { type: 'integer' },
    createdAt: { type: 'date' },
    storeId: { type: 'keyword' },
    storeName: {
      type: 'text',
      analyzer: 'indonesian',
      fields: { raw: { type: 'keyword', ignore_above: 255 } },
    },
    storeSlug: { type: 'keyword' },
  },
};
