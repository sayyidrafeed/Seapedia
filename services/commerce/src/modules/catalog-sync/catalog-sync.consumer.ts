import { createOutboxConsumer } from '@seapedia/platform/outbox';
import { env } from '@/env';
import { catalogClient } from '@/modules/clients/clients.index';
import { CatalogRefs } from './catalog-sync.service';

/** Pulls catalog's `product` / `store` events into the local replicas. */
export const catalogEventsConsumer = createOutboxConsumer({
  producer: catalogClient,
  consumer: 'commerce',
  intervalMs: env.OUTBOX_POLL_INTERVAL_MS,
  handle: (events) => CatalogRefs.applyEvents(events),
});
