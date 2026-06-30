import { pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

export const systemTimeOffset = pgTable('system_time_offset', {
  id: integer('id').primaryKey().default(1),
  offsetSeconds: integer('offset_seconds').default(0).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
