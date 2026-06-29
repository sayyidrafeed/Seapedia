import { db } from '@/db';
import { wallets, walletTransactions, addresses } from '@/db/schema';
import { eq, and, desc, not, sql, asc } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';

export interface CreateAddressInput {
  label: string;
  recipientName: string;
  phoneNumber: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  fullAddress: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  label?: string;
  recipientName?: string;
  phoneNumber?: string;
  province?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  fullAddress?: string;
  isDefault?: boolean;
}

export class BuyersService {
  static async getOrCreateWallet(userId: string) {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);

    if (wallet) {
      return wallet;
    }

    const [newWallet] = await db.insert(wallets).values({ userId, balance: 0 }).returning();

    return newWallet;
  }

  static async createTopUpRequest(userId: string, amount: number, paymentMethod: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const refNumber = '880' + Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const [transaction] = await db
      .insert(walletTransactions)
      .values({
        walletId: wallet.id,
        amount,
        type: 'topup',
        paymentMethod,
        status: 'pending',
        reference: refNumber,
      })
      .returning();

    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 24); // 24 hours expiry

    return {
      transaction,
      paymentInstructions: {
        virtualAccount: refNumber,
        expiryTime: expiryTime.toISOString(),
      },
    };
  }

  static async simulateTopUpPayment(userId: string, transactionId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const [transaction] = await db
      .select()
      .from(walletTransactions)
      .where(
        and(eq(walletTransactions.id, transactionId), eq(walletTransactions.walletId, wallet.id)),
      )
      .limit(1);

    if (!transaction) {
      throw new NotFoundError('Transaction not found or does not belong to user');
    }

    if (transaction.status === 'success') {
      return transaction;
    }

    const [updatedTransaction] = await db.transaction(async (tx) => {
      const [updatedTx] = await tx
        .update(walletTransactions)
        .set({ status: 'success' })
        .where(eq(walletTransactions.id, transactionId))
        .returning();

      await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${transaction.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id));

      return [updatedTx];
    });

    return updatedTransaction;
  }

  static async getWalletTransactions(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, wallet.id))
      .orderBy(desc(walletTransactions.createdAt));
  }

  static async getAddresses(userId: string) {
    return await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
  }

  static async createAddress(userId: string, input: CreateAddressInput) {
    const existingAddresses = await this.getAddresses(userId);
    const isFirstAddress = existingAddresses.length === 0;

    let shouldBeDefault = input.isDefault || isFirstAddress;

    return await db.transaction(async (tx) => {
      if (shouldBeDefault) {
        // Set other addresses to non-default
        await tx
          .update(addresses)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(addresses.userId, userId));
      }

      const [newAddress] = await tx
        .insert(addresses)
        .values({
          userId,
          label: input.label,
          recipientName: input.recipientName,
          phoneNumber: input.phoneNumber,
          province: input.province,
          city: input.city,
          district: input.district,
          postalCode: input.postalCode,
          fullAddress: input.fullAddress,
          isDefault: shouldBeDefault,
        })
        .returning();

      return newAddress;
    });
  }

  static async updateAddress(userId: string, addressId: string, input: UpdateAddressInput) {
    const [existing] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Address not found');
    }

    return await db.transaction(async (tx) => {
      if (input.isDefault && !existing.isDefault) {
        await tx
          .update(addresses)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(addresses.userId, userId));
      }

      const [updatedAddress] = await tx
        .update(addresses)
        .set({
          label: input.label ?? existing.label,
          recipientName: input.recipientName ?? existing.recipientName,
          phoneNumber: input.phoneNumber ?? existing.phoneNumber,
          province: input.province ?? existing.province,
          city: input.city ?? existing.city,
          district: input.district ?? existing.district,
          postalCode: input.postalCode ?? existing.postalCode,
          fullAddress: input.fullAddress ?? existing.fullAddress,
          isDefault: input.isDefault ?? existing.isDefault,
          updatedAt: new Date(),
        })
        .where(eq(addresses.id, addressId))
        .returning();

      return updatedAddress;
    });
  }

  static async deleteAddress(userId: string, addressId: string) {
    const [existing] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Address not found');
    }

    await db.transaction(async (tx) => {
      await tx.delete(addresses).where(eq(addresses.id, addressId));

      if (existing.isDefault) {
        // Find another address and make it default
        const [nextAddress] = await tx
          .select()
          .from(addresses)
          .where(eq(addresses.userId, userId))
          .orderBy(asc(addresses.createdAt))
          .limit(1);

        if (nextAddress) {
          await tx
            .update(addresses)
            .set({ isDefault: true, updatedAt: new Date() })
            .where(eq(addresses.id, nextAddress.id));
        }
      }
    });

    return { success: true };
  }

  static async setDefaultAddress(userId: string, addressId: string) {
    const [existing] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Address not found');
    }

    await db.transaction(async (tx) => {
      await tx
        .update(addresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(eq(addresses.userId, userId), not(eq(addresses.id, addressId))));

      await tx
        .update(addresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(addresses.id, addressId));
    });

    return { success: true };
  }
}
