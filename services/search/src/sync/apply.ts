import type { EventEnvelope } from '@seapedia/platform/events';
import { z } from 'zod';
import { elastic } from '@/elastic/client';
import type { IndexedProduct } from '@/elastic/documents';
import { alias, storesIndex } from '@/elastic/indices';

const productEvent = z.object({
  id: z.string(),
  storeId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  rating: z.number(),
  reviewCount: z.number().int(),
  soldCount: z.number().int(),
  createdAt: z.string(),
});
const storeEvent = z.object({ id: z.string(), name: z.string(), slug: z.string() });

// Events may repeat or arrive out of order; tombstones stop a late upsert resurrecting a deletion.
const VERSION_GUARD = `
  if (ctx._source.version == null || ctx._source.version < params.doc.version) {
    ctx._source.putAll(params.doc);
  } else {
    ctx.op = 'noop';
  }`;

async function guardedUpsert(index: string, id: string, doc: Record<string, unknown>) {
  await elastic.update({
    index,
    id,
    scripted_upsert: true,
    script: { source: VERSION_GUARD, params: { doc } },
    upsert: {},
    retry_on_conflict: 3,
  });
}

export async function upsertProduct(event: EventEnvelope) {
  const product = productEvent.parse(event.data);
  const store = await elastic
    .get<{ name: string; slug: string }>({ index: storesIndex, id: product.storeId })
    .catch(() => null);
  // The store event has not been applied yet: fail, and the consumer retries after a delay.
  if (!store?._source) throw new Error(`store ${product.storeId} not indexed yet`);

  const doc: IndexedProduct = {
    ...product,
    storeName: store._source.name,
    storeSlug: store._source.slug,
    version: event.version,
    deleted: false,
  };
  await guardedUpsert(alias, product.id, doc);
}

export async function deleteProduct(event: EventEnvelope) {
  const { id } = z.object({ id: z.string() }).parse(event.data);
  await guardedUpsert(alias, id, { id, version: event.version, deleted: true });
}

export async function upsertStore(event: EventEnvelope) {
  const store = storeEvent.parse(event.data);
  await guardedUpsert(storesIndex, store.id, {
    name: store.name,
    slug: store.slug,
    version: event.version,
  });
  await elastic.updateByQuery({
    index: alias,
    conflicts: 'proceed',
    query: { term: { storeId: store.id } },
    script: {
      source: 'ctx._source.storeName = params.name; ctx._source.storeSlug = params.slug;',
      params: { name: store.name, slug: store.slug },
    },
  });
}
