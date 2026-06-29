import * as auth from './auth-schema';
import * as review from './review-schema';
import * as store from './store-schema';
import * as product from './product-schema';

export const schema = {
  ...auth,
  ...review,
  ...store,
  ...product,
};

export * from './auth-schema';
export * from './review-schema';
export * from './store-schema';
export * from './product-schema';
