import { pgTable, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

export const simulationState = pgTable('simulation_state', {
  id: uuid('id').defaultRandom().primaryKey(),
  dayOffset: integer('day_offset').default(0).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
