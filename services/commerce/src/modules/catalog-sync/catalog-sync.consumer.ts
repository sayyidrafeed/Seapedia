import { createEventConsumer } from '@seapedia/platform/events';
import { config } from '@/config';
import { runtime } from '@/runtime';
import { ReplicaSync } from './catalog-sync.service';

export const replicaConsumer = createEventConsumer({
  rabbit: runtime.rabbit,
  queue: 'commerce',
  prefetch: config.get().consumerPrefetch,
  handlers: {
    'catalog.product.upserted': ReplicaSync.productUpserted,
    'catalog.product.deleted': ReplicaSync.productDeleted,
    'catalog.store.upserted': ReplicaSync.storeUpserted,
    'identity.user.registered': ReplicaSync.userUpserted,
    'identity.user.updated': ReplicaSync.userUpserted,
  },
});
