import { pgTable, text, timestamp, uuid, varchar, integer } from 'drizzle-orm/pg-core';
import { users } from './auth-schema';
import { stores } from './store-schema';
import { products } from './product-schema';

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  buyerId: uuid('buyer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  storeId: uuid('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  deliveryMethod: varchar('delivery_method', { length: 50 }).notNull(), // 'instant', 'next_day', 'regular'
  subtotal: integer('subtotal').notNull(),
  deliveryFee: integer('delivery_fee').notNull(),
  ppn: integer('ppn').notNull(),
  totalAmount: integer('total_amount').notNull(),
  status: varchar('status', { length: 50 }).default('sedang_dikemas').notNull(), // 'sedang_dikemas', 'menunggu_pengirim', 'sedang_dikirim', 'pesanan_selesai', 'dikembalikan'
  addressSnapshot: text('address_snapshot').notNull(), // JSON string representing the shipping address at checkout
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: varchar('product_name', { length: 255 }).notNull(),
  productPrice: integer('product_price').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull(), // e.g. 'sedang_dikemas', etc.
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
