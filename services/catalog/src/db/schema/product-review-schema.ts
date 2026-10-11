import { pgTable, integer, text, timestamp, uuid, unique, varchar } from 'drizzle-orm/pg-core';
import { products } from './product-schema';

export const productReviews = pgTable(
  'product_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    // Owned by the identity service; no cross-database foreign key.
    buyerId: uuid('buyer_id').notNull(),
    // Snapshot of the buyer's display name at review time (identity owns the live value).
    reviewerName: varchar('reviewer_name', { length: 255 }).notNull(),
    rating: integer('rating').notNull(),
    comment: text('comment').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqProductReview: unique('uniq_product_review').on(t.productId, t.buyerId),
  }),
);
