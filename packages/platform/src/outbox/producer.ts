import { and, asc, eq, inArray } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { describeRoute, validator } from 'hono-openapi';
import { z } from 'zod';
import { factory } from '../factory';
import { outboxAckSchema, type OutboxTable } from './table';

// Accepts both the root db and a transaction (PgTransaction extends PgDatabase).
type Executor = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export type OutboxOptions<Topic extends string, Consumer extends string> = {
  db: Executor;
  table: OutboxTable;
  /** Which consumers receive each topic. Static: adding a consumer is a code change. */
  subscriptions: Record<Topic, readonly Consumer[]>;
};

export function createOutbox<Topic extends string, Consumer extends string>({
  db,
  table,
  subscriptions,
}: OutboxOptions<Topic, Consumer>) {
  const consumers = [...new Set(Object.values<readonly Consumer[]>(subscriptions).flat())];

  /** Record that `entityIds` changed. Call with the transaction that made the change. */
  async function enqueue(tx: Executor, topic: Topic, entityIds: readonly string[]) {
    const ids = [...new Set(entityIds)];
    const rows = subscriptions[topic].flatMap((consumer) =>
      ids.map((entityId) => ({ consumer, topic, entityId })),
    );
    if (rows.length > 0) await tx.insert(table).values(rows);
  }

  const consumerParam = z.object({ consumer: z.enum(consumers as [Consumer, ...Consumer[]]) });

  /** Internal pull API: `GET /:consumer` returns pending events, `POST /:consumer/ack` deletes them. */
  const router = factory.createApp();

  router.get(
    '/:consumer',
    describeRoute({ hide: true }),
    validator('param', consumerParam),
    validator('query', z.object({ limit: z.coerce.number().int().min(1).max(1000).default(100) })),
    async (c) => {
      const { consumer } = c.req.valid('param');
      const { limit } = c.req.valid('query');
      const events = await db
        .select({ id: table.id, topic: table.topic, entityId: table.entityId })
        .from(table)
        .where(eq(table.consumer, consumer))
        .orderBy(asc(table.id))
        .limit(limit);
      return c.json({ events });
    },
  );

  router.post(
    '/:consumer/ack',
    describeRoute({ hide: true }),
    validator('param', consumerParam),
    validator('json', outboxAckSchema),
    async (c) => {
      const { consumer } = c.req.valid('param');
      const { ids } = c.req.valid('json');
      const deleted = await db
        .delete(table)
        .where(and(eq(table.consumer, consumer), inArray(table.id, ids)))
        .returning({ id: table.id });
      return c.json({ acked: deleted.length });
    },
  );

  return { enqueue, router };
}
