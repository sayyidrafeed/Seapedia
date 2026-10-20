import type { EventEnvelope } from './envelope';
import { EXCHANGE } from './envelope';
import type { Rabbit } from './rabbit';

export type OutboxStore = {
  /** Oldest unpublished events, at most `limit`. */
  pending(limit: number): Promise<EventEnvelope[]>;
  markPublished(ids: string[]): Promise<void>;
};

/**
 * Moves events from a service's transactional outbox to RabbitMQ. An event is marked published
 * only after the broker confirms it, so a crash between the two republishes it (consumers
 * dedupe by id or version).
 */
export function createOutboxRelay({
  rabbit,
  store,
  intervalMs = 500,
  batchSize = 100,
}: {
  rabbit: Rabbit;
  store: OutboxStore;
  intervalMs?: number;
  batchSize?: number;
}) {
  let running = false;

  async function publishOnce(): Promise<number> {
    const events = await store.pending(batchSize);
    if (events.length === 0) return 0;
    const channel = await rabbit.confirmChannel();
    for (const event of events) {
      channel.publish(EXCHANGE, event.type, Buffer.from(JSON.stringify(event)), {
        persistent: true,
        contentType: 'application/json',
        messageId: event.id,
        type: event.type,
        appId: event.source,
        timestamp: Math.floor(Date.parse(event.occurredAt) / 1000),
      });
    }
    await channel.waitForConfirms();
    await store.markPublished(events.map((e) => e.id));
    return events.length;
  }

  async function loop() {
    while (running) {
      let published = 0;
      try {
        published = await publishOnce();
      } catch (error) {
        console.error(JSON.stringify({ event: 'outbox_relay_failed', error: String(error) }));
      }
      if (published < batchSize) await Bun.sleep(intervalMs);
    }
  }

  return {
    publishOnce,
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
