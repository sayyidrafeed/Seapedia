import { and, asc, inArray, isNull, lt, sql } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { EventEnvelope } from './envelope';
import type { OutboxStore } from './relay';

type Executor = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

/** Transactional outbox: events committed together with the state change they describe. */
export function outboxTable() {
  return pgTable('outbox', {
    id: uuid('id').primaryKey(),
    type: text('type').notNull(),
    payload: jsonb('payload').$type<EventEnvelope>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  });
}

/** Consumer-side dedupe for events whose effect is not idempotent (e.g. increments). */
export function inboxTable() {
  return pgTable('inbox', {
    eventId: uuid('event_id').primaryKey(),
    type: text('type').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
  });
}

export type OutboxTable = ReturnType<typeof outboxTable>;
export type InboxTable = ReturnType<typeof inboxTable>;

export function createPostgresOutbox(db: Executor, table: OutboxTable) {
  const store: OutboxStore = {
    async pending(limit) {
      const rows = await db
        .select({ payload: table.payload })
        .from(table)
        .where(isNull(table.publishedAt))
        .orderBy(asc(table.createdAt))
        .limit(limit);
      return rows.map((r) => r.payload);
    },
    async markPublished(ids) {
      await db.update(table).set({ publishedAt: new Date() }).where(inArray(table.id, ids));
      // Keep a week of published events for debugging, then drop them.
      await db.delete(table).where(and(lt(table.publishedAt, sql`now() - interval '7 days'`)));
    },
  };

  return {
    store,
    /** Record events in the caller's transaction. */
    async enqueue(tx: Executor, ...events: EventEnvelope[]) {
      if (events.length === 0) return;
      await tx.insert(table).values(events.map((e) => ({ id: e.id, type: e.type, payload: e })));
    },
  };
}

/**
 * Returns true the first time an event id is seen in this transaction's database; false for a
 * redelivery, in which case the caller skips the side effect.
 */
export async function firstDelivery(tx: Executor, table: InboxTable, event: EventEnvelope) {
  const inserted = await tx
    .insert(table)
    .values({ eventId: event.id, type: event.type })
    .onConflictDoNothing()
    .returning({ eventId: table.eventId });
  return inserted.length > 0;
}
