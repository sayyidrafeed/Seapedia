import * as buyer from './buyer-schema';
import * as cart from './cart-schema';
import * as order from './order-schema';
import * as discount from './discount-schema';
import * as delivery from './delivery-schema';
import * as timeOffset from './system-time-offset-schema';
import * as refs from './refs-schema';
import * as outbox from './outbox-schema';

export const schema = {
  ...buyer,
  ...cart,
  ...order,
  ...discount,
  ...delivery,
  ...timeOffset,
  ...refs,
  ...outbox,
};

export * from './buyer-schema';
export * from './cart-schema';
export * from './order-schema';
export * from './discount-schema';
export * from './delivery-schema';
export * from './system-time-offset-schema';
export * from './refs-schema';
export * from './outbox-schema';
