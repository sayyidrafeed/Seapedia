import { db } from '../index';
import {
  users, userRole, activeSession,
  stores,
  products,
  wallets, walletTransactions, addresses,
  carts, cartItems,
  orders, orderItems, orderStatusHistory,
  vouchers, promos,
  deliveryJobs,
  appReview,
} from '../schema';
import type { DemoAddress } from './data';

export async function createUser(data: {
  username: string;
  email: string;
  passwordHash: string;
  name: string | null;
  isOnboarded: boolean;
}) {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function addUserRole(userId: string, role: string) {
  const [ur] = await db.insert(userRole).values({ userId, role }).returning();
  return ur;
}

export async function createSession(userId: string, activeRole: string) {
  const [s] = await db.insert(activeSession).values({ userId, activeRole }).returning();
  return s;
}

export async function createStore(data: {
  sellerId: string;
  name: string;
  slug: string;
  description: string | null;
}) {
  const [store] = await db.insert(stores).values(data).returning();
  return store;
}

export async function createProduct(data: {
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
}) {
  const [product] = await db.insert(products).values(data).returning();
  return product;
}

export async function createWallet(data: {
  userId: string;
  balance: number;
}) {
  const [wallet] = await db.insert(wallets).values(data).returning();
  return wallet;
}

export async function createTransaction(data: {
  walletId: string;
  amount: number;
  type: 'topup' | 'payment' | 'refund';
  paymentMethod: string | null;
  status: 'pending' | 'success' | 'failed';
  reference: string;
}) {
  const [tx] = await db.insert(walletTransactions).values(data).returning();
  return tx;
}

export async function createAddress(data: DemoAddress & { userId: string }) {
  const [addr] = await db.insert(addresses).values(data).returning();
  return addr;
}

export async function createCart(data: {
  buyerId: string;
  storeId: string | null;
}) {
  const [cart] = await db.insert(carts).values(data).returning();
  return cart;
}

export async function addCartItem(data: {
  cartId: string;
  productId: string;
  quantity: number;
}) {
  const [item] = await db.insert(cartItems).values(data).returning();
  return item;
}

export async function createOrder(data: {
  buyerId: string;
  storeId: string;
  deliveryMethod: string;
  subtotal: number;
  discountAmount: number;
  discountCode: string | null;
  discountType: string | null;
  deliveryFee: number;
  ppn: number;
  totalAmount: number;
  status: string;
  addressSnapshot: string;
  createdAt?: Date;
}) {
  const [order] = await db.insert(orders).values(data).returning();
  return order;
}

export async function addOrderItem(data: {
  orderId: string;
  productId: string | null;
  productName: string;
  productPrice: number;
  quantity: number;
}) {
  const [item] = await db.insert(orderItems).values(data).returning();
  return item;
}

export async function addStatusHistory(data: {
  orderId: string;
  status: string;
  note: string | null;
}) {
  const [history] = await db.insert(orderStatusHistory).values(data).returning();
  return history;
}

export async function createVoucher(data: {
  code: string;
  discountAmount: number;
  minOrderAmount: number;
  expiresAt: Date;
  remainingUsage: number;
}) {
  const [v] = await db.insert(vouchers).values(data).returning();
  return v;
}

export async function createPromo(data: {
  code: string;
  discountPercent: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  expiresAt: Date;
}) {
  const [p] = await db.insert(promos).values(data).returning();
  return p;
}

export async function createDeliveryJob(data: {
  orderId: string;
  driverId: string | null;
  status: string;
  deliveryFee: number;
}) {
  const [job] = await db.insert(deliveryJobs).values(data).returning();
  return job;
}

export async function createReview(data: {
  reviewerName: string;
  rating: number;
  comment: string;
}) {
  const [review] = await db.insert(appReview).values(data).returning();
  return review;
}
