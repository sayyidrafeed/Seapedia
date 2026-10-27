import { integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// Replicas fed by other services' events; never written by a commerce use case.
export const storeRefs = pgTable('store_refs', {
  id: uuid('id').primaryKey(),
  sellerId: uuid('seller_id').notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  version: integer('version').notNull(),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
});

export const productRefs = pgTable('product_refs', {
  id: uuid('id').primaryKey(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => storeRefs.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  price: integer('price').notNull(), // IDR, catalog's current price
  imageKey: varchar('image_key', { length: 512 }),
  version: integer('version').notNull(),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
});

// Owned here so checkout reserves stock in the same transaction as the wallet debit.
export const inventory = pgTable('inventory', {
  productId: uuid('product_id')
    .primaryKey()
    .references(() => productRefs.id, { onDelete: 'cascade' }),
  stock: integer('stock').default(0).notNull(),
  // Version carried by `commerce.inventory.changed`, so catalog applies changes in order.
  version: integer('version').default(0).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Replica of identity users and their roles, for the admin dashboard's user counts.
export const userRefs = pgTable('user_refs', {
  id: uuid('id').primaryKey(),
  roles: varchar('roles', { length: 32 }).array().notNull(),
  version: integer('version').notNull(),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
});
