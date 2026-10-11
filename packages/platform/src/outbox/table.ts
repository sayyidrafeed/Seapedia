import { bigserial, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';

/**
 * Transactional outbox. One row per (event, subscribed consumer), written in the same transaction
 * as the state change. Consumers pull their rows and ack them individually, so a bigserial gap
 * from out-of-order commits can never make a consumer skip an event.
 */
export function outboxTable() {
  return pgTable(
    'outbox',
    {
      id: bigserial('id', { mode: 'number' }).primaryKey(),
      consumer: text('consumer').notNull(),
      topic: text('topic').notNull(),
      entityId: uuid('entity_id').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [index('outbox_consumer_id_idx').on(t.consumer, t.id)],
  );
}

export type OutboxTable = ReturnType<typeof outboxTable>;

/**
 * Events are thin: they name what changed, never the new state. Consumers fetch the producer's
 * current state when applying, which makes handling idempotent and order-independent.
 */
export const outboxEventSchema = z.object({
  id: z.number().int(),
  topic: z.string(),
  entityId: z.string().uuid(),
});

export type OutboxEvent = z.infer<typeof outboxEventSchema>;

export const outboxBatchSchema = z.object({ events: z.array(outboxEventSchema) });
export const outboxAckSchema = z.object({ ids: z.array(z.number().int()).min(1).max(1000) });
export const outboxAckResponseSchema = z.object({ acked: z.number().int() });
