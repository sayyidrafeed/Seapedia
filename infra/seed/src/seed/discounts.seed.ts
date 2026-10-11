import { vouchers, promos } from '../schema';
import { rawVouchers, rawPromos } from './data/discounts.data';
import type { Dbs } from '../dbs';

export async function seedDiscounts({ commerce: tx }: Dbs) {
  console.log('Seeding vouchers and promos...');

  // Clean up all vouchers and promos
  await tx.delete(vouchers);
  await tx.delete(promos);

  const voucherMap = new Map<string, string>();
  const promoMap = new Map<string, string>();

  for (const raw of rawVouchers) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + raw.expiresInDays);

    const [insertedVoucher] = await tx
      .insert(vouchers)
      .values({
        code: raw.code,
        discountAmount: raw.discountAmount,
        minOrderAmount: raw.minOrderAmount,
        expiresAt,
        remainingUsage: raw.remainingUsage,
      })
      .returning();

    voucherMap.set(raw.code, insertedVoucher.id);
  }

  for (const raw of rawPromos) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + raw.expiresInDays);

    const [insertedPromo] = await tx
      .insert(promos)
      .values({
        code: raw.code,
        discountPercent: raw.discountPercent,
        maxDiscountAmount: raw.maxDiscountAmount,
        minOrderAmount: raw.minOrderAmount,
        expiresAt,
      })
      .returning();

    promoMap.set(raw.code, insertedPromo.id);
  }

  console.log(`Seeded ${rawVouchers.length} vouchers and ${rawPromos.length} promos successfully.`);
  return { voucherMap, promoMap };
}
