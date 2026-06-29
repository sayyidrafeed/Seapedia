import { pgTable, text, timestamp, uuid, varchar, integer } from 'drizzle-orm/pg-core';
import { stores } from './store-schema';

/**
 * Products table.
 * JSDOC WARNING: imageUrl should be added here when object storage / pre-signed URL infrastructure is scaffolded.
 */
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: integer('price').notNull(), // IDR only integer price
  stock: integer('stock').notNull(), // stored for checkout stock checks
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
