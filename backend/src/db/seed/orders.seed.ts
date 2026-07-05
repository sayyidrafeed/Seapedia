/* eslint-disable @typescript-eslint/no-explicit-any, max-lines */
import { eq, sql } from 'drizzle-orm';
import {
  orders,
  orderItems,
  orderStatusHistory,
  wallets,
  walletTransactions,
  products,
} from '../schema';
import { rawProducts } from './data/products.data';
import { rawAddresses } from './data/addresses.data';

interface TargetOrderDistribution {
  status: string;
  count: number;
}

const distribution: TargetOrderDistribution[] = [
  { status: 'pesanan_selesai', count: 55 },
  { status: 'sedang_dikirim', count: 12 },
  { status: 'menunggu_pengirim', count: 8 },
  { status: 'sedang_dikemas', count: 15 },
  { status: 'dikembalikan', count: 10 },
];

const deliveryMethods = ['instant', 'next_day', 'regular'];
const deliveryFees: Record<string, number> = {
  instant: 30000,
  next_day: 15000,
  regular: 10000,
};

export async function seedOrders(
  tx: any,
  userMap: Map<string, string>,
  storeMap: Map<string, string>,
  productMap: Map<string, string>,
  _voucherMap: Map<string, string>,
  _promoMap: Map<string, string>,
) {
  console.log('Seeding orders...');

  const orderMap = new Map<string, string>();
  let orderIndex = 0;

  const buyers = [
    'dewi_lestari',
    'sari_dewi',
    'putri_anggraini',
    'andi_prasetyo',
    'rizki_pratama',
    'nadia_saputri',
    'agus_setiawan',
    'rina_wulandari',
    'rina_multi',
  ];

  // We need to fetch the products and group them by store
  const storeToProducts: Record<string, typeof rawProducts> = {};
  for (const p of rawProducts) {
    if (!storeToProducts[p.storeSlug]) {
      storeToProducts[p.storeSlug] = [];
    }
    storeToProducts[p.storeSlug].push(p);
  }

  const storeSlugs = Object.keys(storeToProducts);

  // Generate orders based on distribution
  for (const dist of distribution) {
    for (let i = 0; i < dist.count; i++) {
      // 1. Pick a random buyer and their default address
      const buyerUsername = buyers[Math.floor(Math.random() * buyers.length)];
      const buyerId = userMap.get(buyerUsername)!;
      const buyerAddressRaw =
        rawAddresses.find((a) => a.buyerUsername === buyerUsername && a.isDefault) ||
        rawAddresses.find((a) => a.buyerUsername === buyerUsername)!;

      const addressSnapshot = JSON.stringify({
        label: buyerAddressRaw.label,
        recipientName: buyerAddressRaw.recipientName,
        phoneNumber: buyerAddressRaw.phoneNumber,
        province: buyerAddressRaw.province,
        city: buyerAddressRaw.city,
        district: buyerAddressRaw.district,
        postalCode: buyerAddressRaw.postalCode,
        fullAddress: buyerAddressRaw.fullAddress,
      });

      // 2. Pick a random store and 1-3 random products from that store
      const storeSlug = storeSlugs[Math.floor(Math.random() * storeSlugs.length)];
      const storeId = storeMap.get(storeSlug)!;
      const storeProds = storeToProducts[storeSlug];
      const numItems = Math.floor(Math.random() * 3) + 1; // 1 to 3 items

      // Shuffle products
      const shuffledProds = [...storeProds].sort(() => 0.5 - Math.random());
      const selectedProds = shuffledProds.slice(0, Math.min(numItems, shuffledProds.length));

      let subtotal = 0;
      const itemsToInsert = [];

      for (const p of selectedProds) {
        const quantity = Math.floor(Math.random() * 2) + 1; // 1 or 2 of each
        const productId = productMap.get(p.slug)!;
        subtotal += p.price * quantity;

        itemsToInsert.push({
          productId,
          productName: p.name,
          productPrice: p.price,
          quantity,
        });
      }

      // 3. Handle discount (vouchers or promos)
      let discountAmount = 0;
      let discountCode: string | null = null;
      let discountType: string | null = null;

      // Apply a voucher/promo with 40% probability if subtotal is high enough
      if (Math.random() < 0.4 && subtotal >= 50000) {
        if (Math.random() < 0.5) {
          // Voucher
          discountCode = subtotal >= 200000 ? 'HEMAT50K' : 'HEMAT25K';
          discountAmount = discountCode === 'HEMAT50K' ? 50000 : 25000;
          discountType = 'voucher';
        } else {
          // Promo
          discountCode = 'PROMO10';
          discountAmount = Math.round(subtotal * 0.1);
          discountType = 'promo';
        }
      }

      const discountedSubtotal = Math.max(0, subtotal - discountAmount);
      const deliveryMethod = deliveryMethods[Math.floor(Math.random() * deliveryMethods.length)];
      const deliveryFee = deliveryFees[deliveryMethod];
      const taxBase = discountedSubtotal + deliveryFee;
      const ppn = Math.round(taxBase * 0.12);
      const totalAmount = taxBase + ppn;

      // 4. Create the Order
      // Distribute timestamps over the last 30 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 28));

      const [insertedOrder] = await tx
        .insert(orders)
        .values({
          buyerId,
          storeId,
          deliveryMethod,
          subtotal,
          discountAmount,
          discountCode,
          discountType,
          deliveryFee,
          ppn,
          totalAmount,
          status: dist.status,
          addressSnapshot,
          createdAt,
          updatedAt: createdAt,
        })
        .returning();

      orderMap.set(`order_${orderIndex}`, insertedOrder.id);
      orderIndex++;

      // 5. Create Order Items
      for (const item of itemsToInsert) {
        await tx.insert(orderItems).values({
          orderId: insertedOrder.id,
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          quantity: item.quantity,
          createdAt,
          updatedAt: createdAt,
        });

        // Increment soldCount for products in completed/shipped/returned orders
        if (['pesanan_selesai', 'sedang_dikirim', 'dikembalikan'].includes(dist.status)) {
          await tx
            .update(products)
            .set({
              soldCount: sql`${products.soldCount} + ${item.quantity}`,
            })
            .where(eq(products.id, item.productId));
        }
      }

      // 6. Create Order Status History
      const notes: Record<string, string> = {
        sedang_dikemas: 'Order successfully created. Payment completed via wallet.',
        menunggu_pengirim: 'Pesanan sedang diproses oleh penjual.',
        sedang_dikirim: 'Pesanan dalam perjalanan.',
        pesanan_selesai: 'Pesanan berhasil diterima.',
        dikembalikan: 'Pesanan telah dikembalikan dan dana direfund.',
      };

      const statusSequence = [
        'sedang_dikemas',
        'menunggu_pengirim',
        'sedang_dikirim',
        'pesanan_selesai',
      ];
      const targetIndex = statusSequence.indexOf(dist.status);

      let historyTime = new Date(createdAt);
      if (targetIndex >= 0) {
        // Go through the sequence
        for (let sIdx = 0; sIdx <= targetIndex; sIdx++) {
          const status = statusSequence[sIdx];
          historyTime = new Date(historyTime);
          historyTime.setHours(historyTime.getHours() + sIdx * 2);

          await tx.insert(orderStatusHistory).values({
            orderId: insertedOrder.id,
            status,
            note: notes[status],
            createdAt: historyTime,
          });
        }
      } else if (dist.status === 'dikembalikan') {
        // Sequentially go to pesanan_selesai then dikembalikan
        for (let sIdx = 0; sIdx < statusSequence.length; sIdx++) {
          const status = statusSequence[sIdx];
          historyTime = new Date(historyTime);
          historyTime.setHours(historyTime.getHours() + sIdx * 2);

          await tx.insert(orderStatusHistory).values({
            orderId: insertedOrder.id,
            status,
            note: notes[status],
            createdAt: historyTime,
          });
        }
        // Then return
        historyTime = new Date(historyTime);
        historyTime.setHours(historyTime.getHours() + 4);
        await tx.insert(orderStatusHistory).values({
          orderId: insertedOrder.id,
          status: 'dikembalikan',
          note: notes.dikembalikan,
          createdAt: historyTime,
        });
      }

      // 7. Deduct from Wallet & Create payment transaction
      const buyerWallet = await tx.query.wallets.findFirst({
        where: eq(wallets.userId, buyerId),
      });

      if (buyerWallet) {
        const newBalance = buyerWallet.balance - totalAmount;
        await tx.update(wallets).set({ balance: newBalance }).where(eq(wallets.id, buyerWallet.id));

        const randomRef = 'PAY-' + Math.floor(1000000000 + Math.random() * 9000000000).toString();

        await tx.insert(walletTransactions).values({
          walletId: buyerWallet.id,
          amount: -totalAmount,
          type: 'payment',
          status: 'success',
          reference: randomRef,
          createdAt,
        });

        // If returned, refund to wallet
        if (dist.status === 'dikembalikan') {
          await tx
            .update(wallets)
            .set({ balance: newBalance + totalAmount })
            .where(eq(wallets.id, buyerWallet.id));

          const refundRef = 'REF-' + Math.floor(1000000000 + Math.random() * 9000000000).toString();

          await tx.insert(walletTransactions).values({
            walletId: buyerWallet.id,
            amount: totalAmount,
            type: 'refund',
            status: 'success',
            reference: refundRef,
            createdAt: historyTime,
          });
        }
      }
    }
  }

  console.log(`Seeded 100 orders and status history successfully.`);
  return orderMap;
}
