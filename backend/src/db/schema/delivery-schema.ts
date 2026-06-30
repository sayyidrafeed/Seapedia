import { pgTable, timestamp, uuid, varchar, integer } from 'drizzle-orm/pg-core';
import { users } from './auth-schema';
import { orders } from './order-schema';

export const deliveryJobs = pgTable('delivery_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: 'cascade' }),
  driverId: uuid('driver_id').references(() => users.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // 'pending', 'taken', 'completed'
  deliveryFee: integer('delivery_fee').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
