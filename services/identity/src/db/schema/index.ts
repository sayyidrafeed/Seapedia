import * as auth from './auth-schema';
import * as outbox from './outbox-schema';

export const schema = {
  ...auth,
  ...outbox,
};

export * from './auth-schema';
export * from './outbox-schema';
