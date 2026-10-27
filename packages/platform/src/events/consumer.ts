import type { Channel, ConsumeMessage } from 'amqplib';
import { envelopeSchema, PARKING_EXCHANGE, type EventEnvelope } from './envelope';
import type { Rabbit } from './rabbit';

export type EventHandler = (event: EventEnvelope) => Promise<void>;

export type ConsumerOptions = {
  rabbit: Rabbit;
  // Declared by infra/rabbitmq/init.ts with its bindings, retry and parking queues, so events
  // published before this service first starts are kept.
  queue: string;
  // A stream is read from its start on every (re)connect: nothing is consumed away, and a
  // restarted instance replays what it missed. Failures are logged, not retried.
  stream?: boolean;
  handlers: Record<string, EventHandler>;
  prefetch?: number;
  // Attempts before a message is parked in `<queue>.parked` for a human to look at.
  maxAttempts?: number;
};

function attempts(msg: ConsumeMessage): number {
  const deaths = msg.properties.headers?.['x-death'] as
    | { count?: number; queue?: string }[]
    | undefined;
  return 1 + (deaths?.reduce((sum, d) => sum + (d.count ?? 0), 0) ?? 0) / 2;
}

// Failed messages retry via Q.retry (TTL) back to Q only, then park in Q.parked; handlers must be idempotent.
export function createEventConsumer({
  rabbit,
  queue,
  stream = false,
  handlers,
  prefetch = 20,
  maxAttempts = 5,
}: ConsumerOptions) {
  let running = false;
  let channel: Channel | null = null;

  async function setup() {
    const ch = await rabbit.channel();
    await ch.prefetch(prefetch);
    await ch.checkQueue(queue);
    const park = (msg: ConsumeMessage) => {
      if (!stream) ch.publish(PARKING_EXCHANGE, queue, msg.content, msg.properties);
    };

    const consumeOptions = stream ? { arguments: { 'x-stream-offset': 'first' } } : {};
    await ch.consume(
      queue,
      async (msg) => {
        if (!msg) return;
        let event: EventEnvelope;
        try {
          event = envelopeSchema.parse(JSON.parse(msg.content.toString())) as EventEnvelope;
        } catch (error) {
          console.error(
            JSON.stringify({ queue, event: 'malformed_message', error: String(error) }),
          );
          park(msg);
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
              queue,
              type: event.type,
              eventId: event.id,
              attempt,
              error: String(error),
            }),
          );
          if (stream) return ch.ack(msg);
          if (attempt >= maxAttempts) {
            park(msg);
            return ch.ack(msg);
          }
          ch.nack(msg, false, false);
        }
      },
      consumeOptions,
    );
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
            queue,
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
