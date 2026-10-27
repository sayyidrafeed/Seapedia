import { createEventConsumer } from '@seapedia/platform/events';
import { runtime } from '@/runtime';
import { deleteProduct, upsertProduct, upsertStore } from './apply';
import { exclusive } from './lock';

// Choreography: the index follows catalog's events; it never asks catalog.
export const consumer = createEventConsumer({
  rabbit: runtime.rabbit,
  queue: 'search',
  handlers: {
    'catalog.product.upserted': (event) => exclusive(() => upsertProduct(event)),
    'catalog.product.deleted': (event) => exclusive(() => deleteProduct(event)),
    'catalog.store.upserted': (event) => exclusive(() => upsertStore(event)),
  },
});
