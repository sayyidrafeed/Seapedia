import { createOutboxConsumer } from '@seapedia/platform/outbox';
import { alias } from '@/elastic/indices';
import { env } from '@/env';
import { catalogClient, fetchDocuments } from './catalog';
import { exclusive } from './lock';
import { idsToFetch, planSync } from './plan';
import { writePlan } from './write';

/** Applies catalog's product/store events to the index, re-reading current documents. */
export const catalogEventsConsumer = createOutboxConsumer({
  producer: catalogClient,
  consumer: 'search',
  intervalMs: env.OUTBOX_POLL_INTERVAL_MS,
  handle: (events) =>
    exclusive(async () => {
      const { productIds, storeIds } = idsToFetch(events);
      const documents = await fetchDocuments(productIds, storeIds);
      await writePlan(alias, planSync(events, documents));
    }),
});
