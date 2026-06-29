import { db } from '@/db';
import { vouchers, promos } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '@/lib/errors';

export interface DiscountResult {
  id: string;
  type: 'voucher' | 'promo';
  code: string;
  discountAmount: number;
  description: string;
}

export class DiscountsService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async validateCode(code: string, subtotal: number, tx?: any): Promise<DiscountResult> {
    const client = tx || db;
    const uppercaseCode = code.trim().toUpperCase();

    // 1. Search in Vouchers
    const [voucher] = await client
      .select()
      .from(vouchers)
      .where(eq(sql`upper(${vouchers.code})`, uppercaseCode))
      .limit(1);

    if (voucher) {
      const now = new Date();
      if (new Date(voucher.expiresAt) < now) {
        throw new ValidationError('Voucher has expired');
      }
      if (voucher.remainingUsage <= 0) {
        throw new ValidationError('Voucher has no remaining usage');
      }
      if (subtotal < voucher.minOrderAmount) {
        throw new ValidationError(
          `Minimum order amount of Rp ${voucher.minOrderAmount.toLocaleString('id-ID')} not met`,
        );
      }

      const discountAmount = Math.min(voucher.discountAmount, subtotal);
      return {
        id: voucher.id,
        type: 'voucher',
        code: voucher.code,
        discountAmount,
        description: `Rp ${voucher.discountAmount.toLocaleString('id-ID')} flat discount`,
      };
    }

    // 2. Search in Promos
    const [promo] = await client
      .select()
      .from(promos)
      .where(eq(sql`upper(${promos.code})`, uppercaseCode))
      .limit(1);

    if (promo) {
      const now = new Date();
      if (new Date(promo.expiresAt) < now) {
        throw new ValidationError('Promo has expired');
      }
      if (subtotal < promo.minOrderAmount) {
        throw new ValidationError(
          `Minimum order amount of Rp ${promo.minOrderAmount.toLocaleString('id-ID')} not met`,
        );
      }

      let discountAmount = Math.floor((subtotal * promo.discountPercent) / 100);
      if (promo.maxDiscountAmount !== null && promo.maxDiscountAmount !== undefined) {
        discountAmount = Math.min(discountAmount, promo.maxDiscountAmount);
      }
      discountAmount = Math.min(discountAmount, subtotal);

      const capInfo = promo.maxDiscountAmount
        ? ` (max Rp ${promo.maxDiscountAmount.toLocaleString('id-ID')})`
        : '';
      return {
        id: promo.id,
        type: 'promo',
        code: promo.code,
        discountAmount,
        description: `${promo.discountPercent}% discount${capInfo}`,
      };
    }

    throw new NotFoundError('Invalid discount code');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async decrementVoucherUsage(tx: any, voucherId: string) {
    const [updated] = await tx
      .update(vouchers)
      .set({
        remainingUsage: sql`${vouchers.remainingUsage} - 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(vouchers.id, voucherId), sql`${vouchers.remainingUsage} > 0`))
      .returning();

    if (!updated) {
      throw new ValidationError('Voucher has no remaining usage left');
    }
    return updated;
  }

  // Admin Methods
  static async createVoucher(data: {
    code: string;
    discountAmount: number;
    minOrderAmount: number;
    expiresAt: Date;
    remainingUsage: number;
  }) {
    const [created] = await db
      .insert(vouchers)
      .values({
        code: data.code,
        discountAmount: data.discountAmount,
        minOrderAmount: data.minOrderAmount,
        expiresAt: data.expiresAt,
        remainingUsage: data.remainingUsage,
      })
      .returning();
    return created;
  }

  static async listVouchers() {
    return await db
      .select()
      .from(vouchers)
      .orderBy(sql`${vouchers.createdAt} DESC`);
  }

  static async getVoucher(id: string) {
    const [voucher] = await db.select().from(vouchers).where(eq(vouchers.id, id)).limit(1);
    if (!voucher) throw new NotFoundError('Voucher not found');
    return voucher;
  }

  static async createPromo(data: {
    code: string;
    discountPercent: number;
    maxDiscountAmount?: number | null;
    minOrderAmount: number;
    expiresAt: Date;
  }) {
    const [created] = await db
      .insert(promos)
      .values({
        code: data.code,
        discountPercent: data.discountPercent,
        maxDiscountAmount: data.maxDiscountAmount ?? null,
        minOrderAmount: data.minOrderAmount,
        expiresAt: data.expiresAt,
      })
      .returning();
    return created;
  }

  static async listPromos() {
    return await db
      .select()
      .from(promos)
      .orderBy(sql`${promos.createdAt} DESC`);
  }

  static async getPromo(id: string) {
    const [promo] = await db.select().from(promos).where(eq(promos.id, id)).limit(1);
    if (!promo) throw new NotFoundError('Promo not found');
    return promo;
  }
}
