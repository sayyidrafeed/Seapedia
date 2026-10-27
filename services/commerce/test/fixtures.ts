import { randomUUID } from 'node:crypto';
import { db } from '@/db';
import {
  addresses,
  inventory,
  orderItems,
  orders,
  productRefs,
  storeRefs,
  wallets,
} from '@/db/schema';

// Rows other services own arrive as replicas; tests insert them directly instead of via events.
export async function seedStore(sellerId: string = randomUUID()) {
  const [store] = await db
    .insert(storeRefs)
    .values({ id: randomUUID(), sellerId, name: 'Toko Laut', slug: 'toko-laut', version: 1 })
    .returning();
  return store;
}

export async function seedProduct(
  storeId: string,
  {
    price = 50_000,
    stock = 10,
    id = randomUUID(),
  }: { price?: number; stock?: number; id?: string } = {},
) {
  const [product] = await db
    .insert(productRefs)
    .values({ id, storeId, name: `Produk ${id.slice(0, 4)}`, slug: id, price, version: 1 })
    .returning();
  await db.insert(inventory).values({ productId: id, stock });
  return product;
}

export async function seedWallet(userId: string, balance: number) {
  const [wallet] = await db.insert(wallets).values({ userId, balance }).returning();
  return wallet;
}

export async function seedAddress(userId: string) {
  const [address] = await db
    .insert(addresses)
    .values({
      userId,
      label: 'Rumah',
      recipientName: 'Dewi',
      phoneNumber: '08123456789',
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      district: 'Kebayoran Baru',
      postalCode: '12110',
      fullAddress: 'Jl. Sudirman No. 1',
      isDefault: true,
    })
    .returning();
  return address;
}

export async function seedOrder(
  fields: Pick<typeof orders.$inferInsert, 'buyerId' | 'storeId'> &
    Partial<typeof orders.$inferInsert>,
  items: { productId: string; quantity: number; price: number }[] = [],
) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const [order] = await db
    .insert(orders)
    .values({
      deliveryMethod: 'regular',
      subtotal,
      deliveryFee: 10_000,
      ppn: 0,
      totalAmount: subtotal + 10_000,
      addressSnapshot: JSON.stringify({ recipientName: 'Dewi', city: 'Jakarta Selatan' }),
      ...fields,
    })
    .returning();
  for (const item of items) {
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: item.productId,
      productName: 'Produk',
      productPrice: item.price,
      quantity: item.quantity,
    });
  }
  return order;
}
