import * as auth from './auth-schema';
import * as review from './review-schema';

export const schema = {
  ...auth,
  ...review,
};

export * from './auth-schema';
export * from './review-schema';
