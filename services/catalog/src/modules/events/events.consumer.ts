import { createOutboxConsumer, type OutboxEvent } from '@seapedia/platform/outbox';
import { z } from 'zod';
import { env } from '@/env';
import { commerceClient } from '@/modules/clients/clients.index';
import { ProductsService } from '@/modules/products/products.index';

const inventorySchema = z.object({
  items: z.array(z.object({ productId: z.string(), stock: z.number().int() })),
});
const salesSchema = z.object({
  items: z.array(z.object({ productId: z.string(), soldCount: z.number().int() })),
});

function idsFor(events: OutboxEvent[], topic: string) {
  return [...new Set(events.filter((e) => e.topic === topic).map((e) => e.entityId))];
}

/**
 * Consumes commerce events. Events are thin, so each batch re-reads commerce's current values:
 * replays and reordering are harmless.
 */
export const commerceEventsConsumer = createOutboxConsumer({
  producer: commerceClient,
  consumer: 'catalog',
  intervalMs: env.OUTBOX_POLL_INTERVAL_MS,
  async handle(events) {
    const stockIds = idsFor(events, 'inventory');
    if (stockIds.length > 0) {
      const { items } = await commerceClient.get('/internal/inventory', inventorySchema, {
        productIds: stockIds,
      });
      await ProductsService.applyStock(items);
    }

    const salesIds = idsFor(events, 'sales');
    if (salesIds.length > 0) {
      const { items } = await commerceClient.get('/internal/sales', salesSchema, {
        productIds: salesIds,
      });
      await ProductsService.applySoldCounts(items);
    }
  },
});
