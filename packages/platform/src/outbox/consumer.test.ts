import { describe, expect, test } from 'bun:test';
import type { InternalClient } from '../internal-client';
import { createOutboxConsumer } from './consumer';
import type { OutboxEvent } from './table';

const EVENTS: OutboxEvent[] = [
  { id: 7, topic: 'product', entityId: '00000000-0000-4000-8000-000000000001' },
  { id: 9, topic: 'store', entityId: '00000000-0000-4000-8000-000000000002' },
];

function fakeProducer() {
  const acks: number[][] = [];
  const producer = {
    get: () => Promise.resolve({ events: EVENTS }),
    post: (_path: string, _schema: unknown, body: { ids: number[] }) => {
      acks.push(body.ids);
      return Promise.resolve({ acked: body.ids.length });
    },
  } as unknown as InternalClient;
  return { producer, acks };
}

describe('outbox consumer', () => {
  test('acks a batch only after the handler succeeds', async () => {
    const { producer, acks } = fakeProducer();
    const seen: OutboxEvent[][] = [];
    const consumer = createOutboxConsumer({
      producer,
      consumer: 'search',
      handle: async (events) => {
        seen.push(events);
      },
    });

    await expect(consumer.drainOnce()).resolves.toBe(2);
    expect(seen).toEqual([EVENTS]);
    expect(acks).toEqual([[7, 9]]);
  });

  test('leaves events pending when the handler fails, so the next poll retries them', async () => {
    const { producer, acks } = fakeProducer();
    const consumer = createOutboxConsumer({
      producer,
      consumer: 'search',
      handle: () => Promise.reject(new Error('elasticsearch down')),
    });

    await expect(consumer.drainOnce()).rejects.toThrow('elasticsearch down');
    expect(acks).toEqual([]);
  });
});
