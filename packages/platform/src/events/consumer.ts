import type { Channel, ConsumeMessage } from 'amqplib';
import {
  envelopeSchema,
  EXCHANGE,
  REDELIVER_EXCHANGE,
  RETRY_EXCHANGE,
  type EventEnvelope,
} from './envelope';
import type { Rabbit } from './rabbit';

export type EventHandler = (event: EventEnvelope) => Promise<void>;

export type ConsumerOptions = {
  rabbit: Rabbit;
  /** Durable queue owned by this service, e.g. `commerce`. Omit for a per-instance queue. */
  queue?: string;
  /** Event types to receive; each is also a routing key binding. */
  handlers: Record<string, EventHandler>;
  prefetch?: number;
  /** Attempts before a message is parked in `<queue>.parked` for a human to look at. */
  maxAttempts?: number;
  retryDelayMs?: number;
};

function attempts(msg: ConsumeMessage): number {
  const deaths = msg.properties.headers?.['x-death'] as
    | { count?: number; queue?: string }[]
    | undefined;
  return 1 + (deaths?.reduce((sum, d) => sum + (d.count ?? 0), 0) ?? 0) / 2;
}

/**
 * Durable choreography consumer. Topology per queue Q:
 *   seapedia.events --(event types)--> Q --(nack)--> seapedia.retry --Q--> Q.retry (TTL)
 *   Q.retry --(expire)--> seapedia.redeliver --Q--> Q
 * A failed message therefore comes back only to Q, after `retryDelayMs`, and is parked in
 * `Q.parked` after `maxAttempts`. Handlers must be idempotent: delivery is at-least-once.
 *
 * Without `queue`, an exclusive auto-delete queue is used (every instance gets every event, no
 * retry), which suits per-process caches such as the session denylist.
 */
export function createEventConsumer({
  rabbit,
  queue,
  handlers,
  prefetch = 20,
  maxAttempts = 5,
  retryDelayMs = 5000,
}: ConsumerOptions) {
  let running = false;
  let channel: Channel | null = null;

  async function setup() {
    const ch = await rabbit.channel();
    await ch.prefetch(prefetch);

    let name: string;
    if (queue) {
      name = queue;
      await ch.assertQueue(name, {
        durable: true,
        arguments: { 'x-dead-letter-exchange': RETRY_EXCHANGE, 'x-dead-letter-routing-key': name },
      });
      await ch.assertQueue(`${name}.retry`, {
        durable: true,
        arguments: {
          'x-message-ttl': retryDelayMs,
          'x-dead-letter-exchange': REDELIVER_EXCHANGE,
          'x-dead-letter-routing-key': name,
        },
      });
      await ch.assertQueue(`${name}.parked`, { durable: true });
      await ch.bindQueue(`${name}.retry`, RETRY_EXCHANGE, name);
      await ch.bindQueue(name, REDELIVER_EXCHANGE, name);
    } else {
      name = (await ch.assertQueue('', { exclusive: true, autoDelete: true })).queue;
    }
    for (const type of Object.keys(handlers)) await ch.bindQueue(name, EXCHANGE, type);

    await ch.consume(name, async (msg) => {
      if (!msg) return;
      let event: EventEnvelope;
      try {
        event = envelopeSchema.parse(JSON.parse(msg.content.toString())) as EventEnvelope;
      } catch (error) {
        console.error(
          JSON.stringify({ queue: name, event: 'malformed_message', error: String(error) }),
        );
        if (queue) ch.sendToQueue(`${name}.parked`, msg.content, msg.properties);
        ch.ack(msg);
        return;
      }

      const handler = handlers[event.type];
      try {
        if (handler) await handler(event);
        ch.ack(msg);
      } catch (error) {
        const attempt = attempts(msg);
        console.error(
          JSON.stringify({
            queue: name,
            type: event.type,
            eventId: event.id,
            attempt,
            error: String(error),
          }),
        );
        if (!queue) return ch.ack(msg);
        if (attempt >= maxAttempts) {
          ch.sendToQueue(`${name}.parked`, msg.content, msg.properties);
          return ch.ack(msg);
        }
        ch.nack(msg, false, false);
      }
    });
    ch.on('close', () => {
      channel = null;
      if (running) void reconnect();
    });
    channel = ch;
  }

  async function reconnect() {
    while (running && !channel) {
      try {
        await setup();
      } catch (error) {
        console.error(
          JSON.stringify({
            queue: queue ?? 'exclusive',
            event: 'consumer_connect_failed',
            error: String(error),
          }),
        );
        await Bun.sleep(3000);
      }
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      void reconnect();
    },
    async stop() {
      running = false;
      await channel?.close().catch(() => undefined);
      channel = null;
    },
  };
}
