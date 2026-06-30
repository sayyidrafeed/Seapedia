import { pgTable, timestamp, uuid, varchar, integer } from 'drizzle-orm/pg-core';

export const vouchers = pgTable('vouchers', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 255 }).notNull().unique(),
  discountAmount: integer('discount_amount').notNull(), // flat amount in IDR
  minOrderAmount: integer('min_order_amount').default(0).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  remainingUsage: integer('remaining_usage').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const promos = pgTable('promos', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 255 }).notNull().unique(),
  discountPercent: integer('discount_percent').notNull(), // percentage off (1-100)
  maxDiscountAmount: integer('max_discount_amount'), // nullable cap
  minOrderAmount: integer('min_order_amount').default(0).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
