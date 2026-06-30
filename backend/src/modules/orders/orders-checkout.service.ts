import { db } from '@/db';
import {
  carts,
  cartItems,
  products,
  addresses,
  wallets,
  walletTransactions,
  orders,
  orderItems,
  orderStatusHistory,
} from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { BuyersCartService } from '@/modules/buyers/buyers-cart.service';
import { DiscountsService } from '@/modules/discounts/discounts.service';

export const DELIVERY_FEES: Record<string, number> = {
  instant: 30000,
  next_day: 15000,
  regular: 10000,
};

export class OrdersCheckoutService {
  static calculateTotals(subtotal: number, deliveryMethod: string, discountAmount = 0) {
    const deliveryFee = DELIVERY_FEES[deliveryMethod] ?? 0;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxBase = discountedSubtotal + deliveryFee;
    const ppn = Math.round(taxBase * 0.12);
    const totalAmount = taxBase + ppn;
    return { deliveryFee, taxBase, ppn, totalAmount, discountedSubtotal };
  }

  static async preview(buyerId: string, deliveryMethod: string, discountCode?: string) {
    const cartSummary = await BuyersCartService.getCartSummary(buyerId);
    if (cartSummary.items.length === 0) {
      return {
        items: [],
        subtotal: 0,
        discountAmount: 0,
        discountCode: null,
        discountType: null,
        deliveryFee: 0,
        taxBase: 0,
        ppn: 0,
        totalAmount: 0,
        deliveryMethod,
        address: null,
        storeId: null,
        storeName: null,
      };
    }

    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, buyerId))
      .orderBy(sql`${addresses.isDefault} DESC, ${addresses.createdAt} DESC`);
    const address = userAddresses[0] ?? null;

    let discountAmount = 0;
    let appliedCode: string | null = null;
    let appliedType: string | null = null;

    if (discountCode) {
      const discountResult = await DiscountsService.validateCode(
        discountCode,
        cartSummary.subtotal,
      );
      discountAmount = discountResult.discountAmount;
      appliedCode = discountResult.code;
      appliedType = discountResult.type;
    }

    const { deliveryFee, taxBase, ppn, totalAmount } = this.calculateTotals(
      cartSummary.subtotal,
      deliveryMethod,
      discountAmount,
    );

    const items = cartSummary.items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      total: item.product.price * item.quantity,
    }));

    return {
      items,
      subtotal: cartSummary.subtotal,
      discountAmount,
      discountCode: appliedCode,
      discountType: appliedType,
      deliveryFee,
      taxBase,
      ppn,
      totalAmount,
      deliveryMethod,
      address: address
        ? {
            ...address,
            createdAt: address.createdAt.toISOString(),
            updatedAt: address.updatedAt.toISOString(),
          }
        : null,
      storeId: cartSummary.storeId,
      storeName: cartSummary.storeName,
    };
  }

  static async createOrder(
    buyerId: string,
    deliveryMethod: string,
    addressId: string,
    discountCode?: string,
  ) {
    return await db.transaction(async (tx) => {
      // 1. Fetch address and verify ownership
      const [address] = await tx
        .select()
        .from(addresses)
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, buyerId)))
        .limit(1);

      if (!address) {
        throw new NotFoundError('Delivery address not found or not owned by user');
      }

      // 2. Fetch cart items and store info
      const [cart] = await tx.select().from(carts).where(eq(carts.buyerId, buyerId)).limit(1);
      if (!cart || !cart.storeId) {
        throw new ValidationError('Cart is empty or not initialized');
      }

      const items = await tx
        .select({
          cartItemId: cartItems.id,
          productId: cartItems.productId,
          quantity: cartItems.quantity,
          product: {
            id: products.id,
            name: products.name,
            price: products.price,
            stock: products.stock,
            storeId: products.storeId,
          },
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.cartId, cart.id));

      if (items.length === 0) {
        throw new ValidationError('Cart is empty');
      }

      // 3. Compute totals
      let subtotal = 0;
      for (const item of items) {
        subtotal += item.product.price * item.quantity;
      }

      let discountAmount = 0;
      let appliedCode: string | null = null;
      let appliedType: string | null = null;
      let discountResult = null;

      if (discountCode) {
        discountResult = await DiscountsService.validateCode(discountCode, subtotal, tx);
        discountAmount = discountResult.discountAmount;
        appliedCode = discountResult.code;
        appliedType = discountResult.type;
      }

      const { deliveryFee, ppn, totalAmount } = this.calculateTotals(
        subtotal,
        deliveryMethod,
        discountAmount,
      );

      // 4. Fetch buyer wallet and verify balance
      let [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, buyerId)).limit(1);
      if (!wallet) {
        [wallet] = await tx.insert(wallets).values({ userId: buyerId, balance: 0 }).returning();
      }

      if (wallet.balance < totalAmount) {
        throw new ValidationError('Insufficient wallet balance');
      }

      // 5. Verify and reduce stock for all items
      const sortedItems = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
      for (const item of sortedItems) {
        if (item.product.stock < item.quantity) {
          throw new ValidationError(
            `Insufficient stock for product "${item.product.name}". Only ${item.product.stock} items left.`,
          );
        }

        const [updatedProduct] = await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(and(eq(products.id, item.productId), sql`${products.stock} >= ${item.quantity}`))
          .returning();

        if (!updatedProduct) {
          throw new ValidationError(
            `Insufficient stock for product "${item.product.name}". Stock updated by another transaction.`,
          );
        }
      }

      // 6. Deduct balance from wallet
      const [updatedWallet] = await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} - ${totalAmount}`,
          updatedAt: new Date(),
        })
        .where(and(eq(wallets.id, wallet.id), sql`${wallets.balance} >= ${totalAmount}`))
        .returning();

      if (!updatedWallet) {
        throw new ValidationError(
          'Insufficient wallet balance. Balance updated by another transaction.',
        );
      }

      // 6.5 Decrement Voucher usage if applied
      if (discountResult && discountResult.type === 'voucher') {
        await DiscountsService.decrementVoucherUsage(tx, discountResult.id);
      }

      // 7. Create wallet transaction
      const reference = 'PAY-' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
      await tx
        .insert(walletTransactions)
        .values({
          walletId: wallet.id,
          amount: -totalAmount,
          type: 'payment',
          status: 'success',
          reference,
        })
        .returning();

      // 8. Create address snapshot
      const addressSnapshotObj = {
        id: address.id,
        userId: address.userId,
        label: address.label,
        recipientName: address.recipientName,
        phoneNumber: address.phoneNumber,
        province: address.province,
        city: address.city,
        district: address.district,
        postalCode: address.postalCode,
        fullAddress: address.fullAddress,
        isDefault: address.isDefault,
        createdAt: address.createdAt.toISOString(),
        updatedAt: address.updatedAt.toISOString(),
      };
      const addressSnapshotStr = JSON.stringify(addressSnapshotObj);

      // 9. Insert order
      const [order] = await tx
        .insert(orders)
        .values({
          buyerId,
          storeId: cart.storeId,
          deliveryMethod,
          subtotal,
          discountAmount,
          discountCode: appliedCode,
          discountType: appliedType,
          deliveryFee,
          ppn,
          totalAmount,
          status: 'sedang_dikemas',
          addressSnapshot: addressSnapshotStr,
        })
        .returning();

      // 10. Insert order items
      for (const item of items) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          productName: item.product.name,
          productPrice: item.product.price,
          quantity: item.quantity,
        });
      }

      // 11. Insert order status history
      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        status: 'sedang_dikemas',
        note: 'Order successfully created. Payment completed via wallet.',
      });

      // 12. Clear cart
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      await tx
        .update(carts)
        .set({ storeId: null, updatedAt: new Date() })
        .where(eq(carts.id, cart.id));

      return order;
    });
  }
}
