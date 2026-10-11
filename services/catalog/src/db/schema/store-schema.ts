import { pgTable, text, timestamp, uuid, varchar, numeric, integer } from 'drizzle-orm/pg-core';

export const stores = pgTable('stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Owned by the identity service; no cross-database foreign key.
  sellerId: uuid('seller_id').notNull().unique(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  logoKey: varchar('logo_key', { length: 512 }),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('0.00').notNull(),
  reviewCount: integer('review_count').default(0).notNull(),
  totalProducts: integer('total_products').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
