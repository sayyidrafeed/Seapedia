import { pgTable, integer, text, timestamp, uuid, unique } from 'drizzle-orm/pg-core';
import { users } from './auth-schema';
import { products } from './product-schema';

export const productReviews = pgTable(
  'product_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqProductReview: unique('uniq_product_review').on(t.productId, t.buyerId),
  }),
);
