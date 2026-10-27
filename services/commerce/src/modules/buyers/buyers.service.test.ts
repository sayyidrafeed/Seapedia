import { describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { db } from '@/db';
import { addresses, wallets } from '@/db/schema';
import { BuyersService } from './buyers.service';

const userId = randomUUID();
const home = {
  label: 'Rumah',
  recipientName: 'Dewi',
  phoneNumber: '08123456789',
  province: 'DKI Jakarta',
  city: 'Jakarta Selatan',
  district: 'Kebayoran Baru',
  postalCode: '12110',
  fullAddress: 'Jl. Sudirman No. 1',
};

describe('wallet', () => {
  test('is created empty on first use and reused afterwards', async () => {
    const first = await BuyersService.getOrCreateWallet(userId);
    const second = await BuyersService.getOrCreateWallet(userId);
    expect(first).toMatchObject({ balance: 0 });
    expect(second.id).toBe(first.id);
  });

  test('a top-up credits the balance and appears in the history', async () => {
    await BuyersService.directTopUp(userId, 50_000);
    await BuyersService.directTopUp(userId, 25_000);

    const [wallet] = await db.select().from(wallets);
    expect(wallet.balance).toBe(75_000);
    const history = await BuyersService.getWalletTransactions(userId);
    expect(history.map((t) => t.amount).sort((a, b) => a - b)).toEqual([25_000, 50_000]);
    expect(history[0]).toMatchObject({ type: 'topup', status: 'success' });
  });
});

describe('addresses', () => {
  test('the first address becomes the default even if not asked', async () => {
    const address = await BuyersService.createAddress(userId, { ...home, isDefault: false });
    expect(address.isDefault).toBe(true);
  });

  test('a new default address takes over, and deleting it hands default back', async () => {
    const first = await BuyersService.createAddress(userId, home);
    const office = await BuyersService.createAddress(userId, {
      ...home,
      label: 'Kantor',
      isDefault: true,
    });

    const defaults = async () =>
      (await db.select().from(addresses)).filter((a) => a.isDefault).map((a) => a.id);
    expect(await defaults()).toEqual([office.id]);

    await BuyersService.deleteAddress(userId, office.id);
    expect(await defaults()).toEqual([first.id]);
  });
});
