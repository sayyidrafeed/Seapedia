import * as store from './store-schema';
import * as product from './product-schema';
import * as productReview from './product-review-schema';
import * as review from './review-schema';
import * as outbox from './outbox-schema';

export const schema = {
  ...store,
  ...product,
  ...productReview,
  ...review,
  ...outbox,
};

export * from './store-schema';
export * from './product-schema';
export * from './product-review-schema';
export * from './review-schema';
export * from './outbox-schema';
