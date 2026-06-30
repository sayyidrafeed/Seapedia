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
  simulationState,
  appReview,
} from '../schema';
import {
  DEMO_USERS, DEMO_STORES, DEMO_PRODUCTS,
  DEMO_WALLETS, DEMO_TRANSACTIONS, DEMO_ADDRESSES,
  DEMO_CARTS, DEMO_CART_ITEMS,
  DEMO_ORDERS, DEMO_ORDER_ITEMS, DEMO_STATUS_HISTORY,
  DEMO_VOUCHERS, DEMO_PROMOS,
  DEMO_DELIVERY_JOBS, DEMO_REVIEWS,
} from './data';
import {
  createUser, addUserRole, createSession,
  createStore,
  createProduct,
  createWallet, createTransaction, createAddress,
  createCart, addCartItem,
  createOrder, addOrderItem, addStatusHistory,
  createVoucher, createPromo,
  createDeliveryJob,
  createReview,
} from './helpers';

async function cleanAll() {
  console.log('Cleaning existing data...');
  await db.delete(deliveryJobs);
  await db.delete(orderStatusHistory);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(cartItems);
  await db.delete(carts);
  await db.delete(walletTransactions);
  await db.delete(wallets);
  await db.delete(addresses);
  await db.delete(products);
  await db.delete(stores);
  await db.delete(activeSession);
  await db.delete(userRole);
  await db.delete(appReview);
  await db.delete(vouchers);
  await db.delete(promos);
  await db.delete(simulationState);
  await db.delete(users);
  console.log('  Done.');
}

async function seedUsers() {
  console.log('Seeding users...');
  const userMap = new Map<string, string>();
  for (const u of DEMO_USERS) {
    const hash = await Bun.password.hash(u.password, 'bcrypt');
    const user = await createUser({
      username: u.username,
      email: u.email,
      passwordHash: hash,
      name: u.name,
      isOnboarded: u.isOnboarded,
    });
    userMap.set(u.username, user.id);
    console.log(`  Created user: ${u.username} (${u.email})`);
  }
  return userMap;
}

async function seedRoles(userMap: Map<string, string>) {
  console.log('Seeding user roles...');
  for (const u of DEMO_USERS) {
    const userId = userMap.get(u.username)!;
    for (const role of u.roles) {
      await addUserRole(userId, role);
    }
  }
  console.log('  Done.');
}

async function seedSessions(userMap: Map<string, string>) {
  console.log('Seeding active sessions...');
  for (const u of DEMO_USERS) {
    const userId = userMap.get(u.username)!;
    await createSession(userId, u.activeRole);
  }
  console.log('  Done.');
}

async function seedStores(userMap: Map<string, string>) {
  console.log('Seeding stores...');
  const storeMap = new Map<string, string>();
  for (const s of DEMO_STORES) {
    const sellerId = userMap.get(s.sellerUsername)!;
    const store = await createStore({
      sellerId,
      name: s.name,
      slug: s.slug,
      description: s.description,
    });
    storeMap.set(s.slug, store.id);
    console.log(`  Created store: ${s.name}`);
  }
  return storeMap;
}

async function seedProducts(storeMap: Map<string, string>) {
  console.log('Seeding products...');
  const productMap = new Map<string, string>();
  for (const p of DEMO_PRODUCTS) {
    const storeId = storeMap.get(p.storeSlug)!;
    const product = await createProduct({
      storeId,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      stock: p.stock,
    });
    productMap.set(p.slug, product.id);
    console.log(`  Created product: ${p.name} (Rp ${p.price.toLocaleString('id-ID')})`);
  }
  return productMap;
}

async function seedWallets(userMap: Map<string, string>) {
  console.log('Seeding wallets...');
  const walletMap = new Map<string, string>();
  for (const w of DEMO_WALLETS) {
    const userId = userMap.get(w.username)!;
    const wallet = await createWallet({ userId, balance: w.balance });
    walletMap.set(w.username, wallet.id);
    console.log(`  Created wallet for ${w.username}: Rp ${w.balance.toLocaleString('id-ID')}`);
  }
  return walletMap;
}

async function seedTransactions(walletMap: Map<string, string>) {
  console.log('Seeding wallet transactions...');
  for (const t of DEMO_TRANSACTIONS) {
    const walletId = walletMap.get(t.username)!;
    await createTransaction({
      walletId,
      amount: t.amount,
      type: t.type,
      paymentMethod: t.paymentMethod,
      status: t.status,
      reference: t.reference,
    });
    console.log(`  Created ${t.type} for ${t.username}: Rp ${t.amount.toLocaleString('id-ID')}`);
  }
}

async function seedAddresses(userMap: Map<string, string>) {
  console.log('Seeding addresses...');
  for (const a of DEMO_ADDRESSES) {
    const userId = userMap.get(a.username)!;
    await createAddress({ ...a, userId });
    console.log(`  Created address: ${a.label} for ${a.username}`);
  }
}

function buildAddressSnapshot(addressIndex: number): string {
  const addr = DEMO_ADDRESSES[addressIndex];
  return JSON.stringify({
    label: addr.label,
    recipientName: addr.recipientName,
    phoneNumber: addr.phoneNumber,
    province: addr.province,
    city: addr.city,
    district: addr.district,
    postalCode: addr.postalCode,
    fullAddress: addr.fullAddress,
  });
}

async function seedCarts(userMap: Map<string, string>, storeMap: Map<string, string>) {
  console.log('Seeding carts...');
  const cartMap = new Map<string, string>();
  for (const c of DEMO_CARTS) {
    const buyerId = userMap.get(c.username)!;
    const storeId = storeMap.get(c.storeSlug)!;
    const cart = await createCart({ buyerId, storeId });
    cartMap.set(c.username, cart.id);
    console.log(`  Created cart for ${c.username}`);
  }
  return cartMap;
}

async function seedCartItems(cartMap: Map<string, string>, productMap: Map<string, string>) {
  console.log('Seeding cart items...');
  for (const ci of DEMO_CART_ITEMS) {
    const cartId = cartMap.get(ci.username)!;
    const productId = productMap.get(ci.productSlug)!;
    await addCartItem({ cartId, productId, quantity: ci.quantity });
    console.log(`  Added ${ci.quantity}x ${ci.productSlug} to ${ci.username}'s cart`);
  }
}

async function seedOrders(userMap: Map<string, string>, storeMap: Map<string, string>) {
  console.log('Seeding orders...');
  const orderMap = new Map<string, string>();
  for (const o of DEMO_ORDERS) {
    const buyerId = userMap.get(o.buyerUsername)!;
    const storeId = storeMap.get(o.storeSlug)!;
    const order = await createOrder({
      buyerId,
      storeId,
      deliveryMethod: o.deliveryMethod,
      subtotal: o.subtotal,
      discountAmount: o.discountAmount,
      discountCode: o.discountCode,
      discountType: o.discountType,
      deliveryFee: o.deliveryFee,
      ppn: o.ppn,
      totalAmount: o.totalAmount,
      status: o.status,
      addressSnapshot: buildAddressSnapshot(o.addressIndex),
      createdAt: o.createdAt,
    });
    orderMap.set(o.ref, order.id);
    console.log(`  Created order ${o.ref}: ${o.status} (Rp ${o.totalAmount.toLocaleString('id-ID')})`);
  }
  return orderMap;
}

async function seedOrderItems(orderMap: Map<string, string>, productMap: Map<string, string>) {
  console.log('Seeding order items...');
  for (const oi of DEMO_ORDER_ITEMS) {
    const orderId = orderMap.get(oi.orderRef)!;
    const productId = productMap.get(oi.productSlug) ?? null;
    await addOrderItem({
      orderId,
      productId,
      productName: oi.productName,
      productPrice: oi.productPrice,
      quantity: oi.quantity,
    });
  }
  console.log('  Done.');
}

async function seedStatusHistory(orderMap: Map<string, string>) {
  console.log('Seeding order status history...');
  for (const sh of DEMO_STATUS_HISTORY) {
    const orderId = orderMap.get(sh.orderRef)!;
    await addStatusHistory({ orderId, status: sh.status, note: sh.note });
  }
  console.log('  Done.');
}

async function seedDiscounts() {
  console.log('Seeding vouchers...');
  for (const v of DEMO_VOUCHERS) {
    await createVoucher(v);
    console.log(`  Created voucher: ${v.code} (Rp ${v.discountAmount.toLocaleString('id-ID')} off)`);
  }
  console.log('Seeding promos...');
  for (const p of DEMO_PROMOS) {
    await createPromo(p);
    console.log(`  Created promo: ${p.code} (${p.discountPercent}% off)`);
  }
}

async function seedDeliveryJobs(orderMap: Map<string, string>, userMap: Map<string, string>) {
  console.log('Seeding delivery jobs...');
  for (const dj of DEMO_DELIVERY_JOBS) {
    const orderId = orderMap.get(dj.orderRef)!;
    const driverId = dj.driverUsername ? (userMap.get(dj.driverUsername) ?? null) : null;
    await createDeliveryJob({ orderId, driverId, status: dj.status, deliveryFee: dj.deliveryFee });
    console.log(`  Created delivery job for order ${dj.orderRef}: ${dj.status}`);
  }
}

async function seedReviews() {
  console.log('Seeding reviews...');
  for (const r of DEMO_REVIEWS) {
    await createReview(r);
    console.log(`  Created review by ${r.reviewerName}: ${r.rating}/5`);
  }
}

async function seedSimulation() {
  console.log('Initializing simulation state...');
  await db.insert(simulationState).values({
    id: '00000000-0000-0000-0000-000000000001',
    dayOffset: 0,
  });
  console.log('  Simulation clock set to +0 days.');
}

async function seed() {
  console.log('=== SEAPEDIA Database Seed ===\n');

  await cleanAll();

  const userMap = await seedUsers();
  await seedRoles(userMap);
  await seedSessions(userMap);
  const storeMap = await seedStores(userMap);
  const productMap = await seedProducts(storeMap);
  const walletMap = await seedWallets(userMap);
  await seedTransactions(walletMap);
  await seedAddresses(userMap);
  const cartMap = await seedCarts(userMap, storeMap);
  await seedCartItems(cartMap, productMap);
  const orderMap = await seedOrders(userMap, storeMap);
  await seedOrderItems(orderMap, productMap);
  await seedStatusHistory(orderMap);
  await seedDiscounts();
  await seedDeliveryJobs(orderMap, userMap);
  await seedReviews();
  await seedSimulation();

  console.log('\n=== Seed Complete! ===');
  console.log('\nDemo Accounts:');
  for (const u of DEMO_USERS) {
    console.log(`  ${u.username.padEnd(12)} ${u.roles.join(', ').padEnd(25)} ${u.password}`);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
