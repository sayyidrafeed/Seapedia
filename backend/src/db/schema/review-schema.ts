import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const appReview = pgTable('app_review', {
  id: uuid('id').defaultRandom().primaryKey(),
  reviewerName: varchar('reviewer_name', { length: 255 }).notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
