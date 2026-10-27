import { dataOf } from '@seapedia/contracts/events';
import type { EventEnvelope } from '@seapedia/platform/events';
import { elastic } from '@/elastic/client';
import type { IndexedProduct } from '@/elastic/documents';
import { alias, buildingAlias, storesIndex } from '@/elastic/indices';

// Events may repeat or arrive out of order; tombstones stop a late upsert resurrecting a deletion.
const VERSION_GUARD = `
  if (ctx._source.version == null || ctx._source.version < params.doc.version) {
    ctx._source.putAll(params.doc);
  } else {
    ctx.op = 'noop';
  }`;

async function guardedUpsert(index: string, id: string, doc: Record<string, unknown>) {
  const result = await elastic.update({
    index,
    id,
    scripted_upsert: true,
    script: { source: VERSION_GUARD, params: { doc } },
    upsert: {},
    retry_on_conflict: 3,
    require_alias: index !== storesIndex,
  });
  return result.result !== 'noop';
}

// The live index, plus the one a rebuild (on any instance) is filling, if there is one.
async function upsertProductDoc(id: string, doc: Record<string, unknown>) {
  await guardedUpsert(alias, id, doc);
  await guardedUpsert(buildingAlias, id, doc).catch((error) => {
    if (!String(error).includes('index_not_found_exception')) throw error;
  });
}

export async function upsertProduct(event: EventEnvelope) {
  const product = dataOf('catalog.product.upserted', event);
  const store = await elastic
    .get<{ name: string; slug: string }>({ index: storesIndex, id: product.storeId })
    .catch(() => null);
  // The store event has not been applied yet: fail, and the consumer retries after a delay.
  if (!store?._source) throw new Error(`store ${product.storeId} not indexed yet`);

  // Price and stock stay out of the index: catalog loads them for every result.
  const doc: IndexedProduct = {
    id: product.id,
    storeId: product.storeId,
    name: product.name,
    slug: product.slug,
    description: product.description,
    rating: product.rating,
    reviewCount: product.reviewCount,
    soldCount: product.soldCount,
    createdAt: product.createdAt,
    storeName: store._source.name,
    storeSlug: store._source.slug,
    version: event.version,
    deleted: false,
  };
  await upsertProductDoc(product.id, doc);
}

export async function deleteProduct(event: EventEnvelope) {
  const { id } = dataOf('catalog.product.deleted', event);
  await upsertProductDoc(id, { id, version: event.version, deleted: true });
}

export async function upsertStore(event: EventEnvelope) {
  const store = dataOf('catalog.store.upserted', event);
  const applied = await guardedUpsert(storesIndex, store.id, {
    name: store.name,
    slug: store.slug,
    version: event.version,
  });
  // A stale store event must not rename that store's products back.
  if (!applied) return;
  await elastic.updateByQuery({
    index: [alias, buildingAlias],
    ignore_unavailable: true,
    conflicts: 'proceed',
    query: { term: { storeId: store.id } },
    script: {
      source: 'ctx._source.storeName = params.name; ctx._source.storeSlug = params.slug;',
      params: { name: store.name, slug: store.slug },
    },
  });
}
