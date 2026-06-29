import * as auth from './auth-schema';
import * as review from './review-schema';
import * as store from './store-schema';

export const schema = {
  ...auth,
  ...review,
  ...store,
};

export * from './auth-schema';
export * from './review-schema';
export * from './store-schema';
