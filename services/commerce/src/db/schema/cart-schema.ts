import { pgTable, integer, timestamp, uuid, unique } from 'drizzle-orm/pg-core';
import { productRefs, storeRefs } from './refs-schema';

export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Owned by the identity service; no cross-database foreign key.
  buyerId: uuid('buyer_id').notNull().unique(),
  storeId: uuid('store_id').references(() => storeRefs.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => productRefs.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqProductInCart: unique('uniq_product_in_cart').on(t.cartId, t.productId),
  }),
);
