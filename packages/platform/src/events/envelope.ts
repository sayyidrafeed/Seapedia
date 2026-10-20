import { z } from 'zod';

/**
 * Every event on the bus. Events carry the producer's full current state (`data`) plus a
 * monotonically increasing `version` per entity, so consumers never call the producer back and
 * can drop stale or duplicate deliveries.
 */
export const envelopeSchema = z.object({
  id: z.string().uuid(),
  /** Also the routing key: `<service>.<entity>.<event>`, e.g. `catalog.product.upserted`. */
  type: z.string().regex(/^[a-z]+\.[a-z-]+\.[a-z-]+$/),
  source: z.string(),
  occurredAt: z.string(),
  /** Entity version; consumers apply an event only if it is newer than what they hold. */
  version: z.number().int().nonnegative(),
  data: z.unknown(),
});

export type EventEnvelope<T = unknown> = Omit<z.infer<typeof envelopeSchema>, 'data'> & { data: T };

export function createEvent<T>(
  source: string,
  type: string,
  data: T,
  version: number,
): EventEnvelope<T> {
  return {
    id: crypto.randomUUID(),
    type,
    source,
    occurredAt: new Date().toISOString(),
    version,
    data,
  };
}

export const EXCHANGE = 'seapedia.events';
/** Failed deliveries wait here (per-queue TTL) before being redelivered to the same queue only. */
export const RETRY_EXCHANGE = 'seapedia.retry';
export const REDELIVER_EXCHANGE = 'seapedia.redeliver';
