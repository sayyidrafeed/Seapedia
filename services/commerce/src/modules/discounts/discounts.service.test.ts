import { describe, expect, test } from 'bun:test';
import { NotFoundError } from '@seapedia/platform/errors';
import { db } from '@/db';
import { promos, vouchers } from '@/db/schema';
import { DiscountsService } from './discounts.service';

const inADay = () => new Date(Date.now() + 86_400_000);

async function seedVoucher(fields: Partial<typeof vouchers.$inferInsert> = {}) {
  const [voucher] = await db
    .insert(vouchers)
    .values({
      code: 'SAVE10',
      discountAmount: 10_000,
      minOrderAmount: 30_000,
      expiresAt: inADay(),
      remainingUsage: 5,
      ...fields,
    })
    .returning();
  return voucher;
}

const seedPromo = (maxDiscountAmount: number) =>
  db.insert(promos).values({
    code: 'PROMO15',
    discountPercent: 15,
    maxDiscountAmount,
    minOrderAmount: 20_000,
    expiresAt: inADay(),
  });

describe('validateCode', () => {
  test('a voucher gives its flat discount, whatever the case of the code typed', async () => {
    await seedVoucher();
    expect(await DiscountsService.validateCode(' save10 ', 50_000)).toMatchObject({
      type: 'voucher',
      code: 'SAVE10',
      discountAmount: 10_000,
    });
  });

  test.each([
    ['has expired', { expiresAt: new Date(Date.now() - 1000) }, 50_000, 'Voucher has expired'],
    ['is used up', { remainingUsage: 0 }, 50_000, 'Voucher has no remaining usage'],
    ['needs a larger order', {}, 20_000, 'Minimum order amount'],
  ])('a voucher that %s is refused', async (_, fields, subtotal, message) => {
    await seedVoucher(fields);
    await expect(DiscountsService.validateCode('SAVE10', subtotal)).rejects.toThrow(message);
  });

  test('a promo takes its percentage, capped at its maximum', async () => {
    await seedPromo(30_000);
    expect((await DiscountsService.validateCode('PROMO15', 100_000)).discountAmount).toBe(15_000);
    await db.delete(promos);
    await seedPromo(10_000);
    expect((await DiscountsService.validateCode('PROMO15', 100_000)).discountAmount).toBe(10_000);
  });

  test('an unknown code is not found', async () => {
    await expect(DiscountsService.validateCode('XYZ', 50_000)).rejects.toThrow(NotFoundError);
  });
});

describe('decrementVoucherUsage', () => {
  test('uses one redemption and refuses once none are left', async () => {
    const voucher = await seedVoucher({ remainingUsage: 1 });

    const updated = await db.transaction((tx) =>
      DiscountsService.decrementVoucherUsage(tx, voucher.id),
    );

    expect(updated.remainingUsage).toBe(0);
    await expect(
      db.transaction((tx) => DiscountsService.decrementVoucherUsage(tx, voucher.id)),
    ).rejects.toThrow('Voucher has no remaining usage left');
  });
});
