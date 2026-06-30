import * as auth from './auth-schema';
import * as review from './review-schema';
import * as store from './store-schema';
import * as product from './product-schema';
import * as buyer from './buyer-schema';
import * as cart from './cart-schema';
import * as order from './order-schema';
import * as discount from './discount-schema';

export const schema = {
  ...auth,
  ...review,
  ...store,
  ...product,
  ...buyer,
  ...cart,
  ...order,
  ...discount,
};

export const carts = cart.carts;
export const cartItems = cart.cartItems;
export const orders = order.orders;
export const orderItems = order.orderItems;
export const orderStatusHistory = order.orderStatusHistory;
export const vouchers = discount.vouchers;
export const promos = discount.promos;

export * from './auth-schema';
export * from './review-schema';
export * from './store-schema';
export * from './product-schema';
export * from './buyer-schema';
export * from './cart-schema';
export * from './order-schema';
export * from './discount-schema';
