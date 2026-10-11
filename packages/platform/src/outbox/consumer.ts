import type { InternalClient } from '../internal-client';
import { outboxAckResponseSchema, outboxBatchSchema, type OutboxEvent } from './table';

export type OutboxConsumerOptions = {
  /** Producer client, e.g. the catalog service. */
  producer: InternalClient;
  /** This consumer's name in the producer's subscription map. */
  consumer: string;
  handle: (events: OutboxEvent[]) => Promise<void>;
  intervalMs?: number;
  batchSize?: number;
  /** Path of the producer's outbox router. */
  path?: string;
};

/**
 * Pull loop: fetch a batch, apply it, then ack. Events are acked only after `handle` succeeds, so
 * delivery is at-least-once; handlers must be idempotent (thin events + fetch current state).
 * Run exactly one loop per consumer.
 */
export function createOutboxConsumer({
  producer,
  consumer,
  handle,
  intervalMs = 2000,
  batchSize = 100,
  path = '/internal/outbox',
}: OutboxConsumerOptions) {
  let running = false;

  /** Processes one batch and returns how many events were applied. */
  async function drainOnce(): Promise<number> {
    const { events } = await producer.get(`${path}/${consumer}`, outboxBatchSchema, {
      limit: batchSize,
    });
    if (events.length === 0) return 0;
    await handle(events);
    await producer.post(`${path}/${consumer}/ack`, outboxAckResponseSchema, {
      ids: events.map((e) => e.id),
    });
    return events.length;
  }

  async function loop() {
    while (running) {
      let applied = 0;
      try {
        applied = await drainOnce();
      } catch (error) {
        console.error(JSON.stringify({ consumer, error: String(error) }));
      }
      if (applied < batchSize) await Bun.sleep(intervalMs);
    }
  }

  return {
    drainOnce,
    start() {
      if (running) return;
      running = true;
      void loop();
    },
    stop() {
      running = false;
    },
  };
}
