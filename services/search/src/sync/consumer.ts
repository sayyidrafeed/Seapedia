import { createEventConsumer } from '@seapedia/platform/events';
import { config } from '@/config';
import { runtime } from '@/runtime';
import { deleteProduct, upsertProduct, upsertStore } from './apply';
import { exclusive } from './lock';
import { indexReady } from './reindex';

// Choreography: the index follows catalog's events; it never asks catalog.
export const consumer = createEventConsumer({
  rabbit: runtime.rabbit,
  queue: 'search',
  prefetch: config.get().consumerPrefetch,
  handlers: {
    'catalog.product.upserted': (event) =>
      indexReady.then(() => exclusive(() => upsertProduct(event))),
    'catalog.product.deleted': (event) =>
      indexReady.then(() => exclusive(() => deleteProduct(event))),
    'catalog.store.upserted': (event) => indexReady.then(() => exclusive(() => upsertStore(event))),
  },
});
