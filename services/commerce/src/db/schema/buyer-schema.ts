import { pgTable, text, timestamp, uuid, varchar, boolean, integer } from 'drizzle-orm/pg-core';

export const wallets = pgTable('wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Owned by the identity service; no cross-database foreign key.
  userId: uuid('user_id').notNull().unique(),
  balance: integer('balance').default(0).notNull(), // Balance in IDR
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletId: uuid('wallet_id')
    .notNull()
    .references(() => wallets.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'topup', 'payment', 'refund'
  status: varchar('status', { length: 50 }).notNull(), // 'pending', 'success', 'failed'
  reference: varchar('reference', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const addresses = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Owned by the identity service; no cross-database foreign key.
  userId: uuid('user_id').notNull(),
  label: varchar('label', { length: 100 }).notNull(), // e.g. 'Rumah', 'Kantor'
  recipientName: varchar('recipient_name', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  province: varchar('province', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  district: varchar('district', { length: 100 }).notNull(),
  postalCode: varchar('postal_code', { length: 10 }).notNull(),
  fullAddress: text('full_address').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
