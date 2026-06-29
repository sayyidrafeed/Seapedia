import * as auth from './auth-schema';
import * as review from './review-schema';
import * as store from './store-schema';
import * as product from './product-schema';
import * as buyer from './buyer-schema';
import * as cart from './cart-schema';

export const schema = {
  ...auth,
  ...review,
  ...store,
  ...product,
  ...buyer,
  ...cart,
};

export const carts = cart.carts;
export const cartItems = cart.cartItems;

export * from './auth-schema';
export * from './review-schema';
export * from './store-schema';
export * from './product-schema';
export * from './buyer-schema';
export * from './cart-schema';
