import { pgTable, text, timestamp, uuid, varchar, integer, numeric } from 'drizzle-orm/pg-core';
import { stores } from './store-schema';

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  price: integer('price').notNull(), // IDR only integer price
  stock: integer('stock').notNull(), // stored for checkout stock checks
  imageKey: varchar('image_key', { length: 512 }),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('0.00').notNull(),
  reviewCount: integer('review_count').default(0).notNull(),
  soldCount: integer('sold_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
