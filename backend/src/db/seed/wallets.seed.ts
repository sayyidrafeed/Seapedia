/* eslint-disable @typescript-eslint/no-explicit-any, max-lines */
import { wallets, walletTransactions, addresses } from '../schema';
import { rawAddresses } from './data/addresses.data';

interface WalletSpec {
  username: string;
  topupAmount: number;
}

const walletSpecs: WalletSpec[] = [
  { username: 'dewi_lestari', topupAmount: 100000000 },
  { username: 'sari_dewi', topupAmount: 100000000 },
  { username: 'putri_anggraini', topupAmount: 100000000 },
  { username: 'andi_prasetyo', topupAmount: 100000000 },
  { username: 'rizki_pratama', topupAmount: 100000000 },
  { username: 'nadia_saputri', topupAmount: 100000000 },
  { username: 'agus_setiawan', topupAmount: 100000000 },
  { username: 'rina_wulandari', topupAmount: 100000000 },
  { username: 'rina_multi', topupAmount: 100000000 },
];

export async function seedWallets(tx: any, userMap: Map<string, string>) {
  console.log('Seeding wallets and addresses...');

  const walletMap = new Map<string, string>();

  // 1. Create wallets for all non-admin users
  for (const [username, userId] of userMap.entries()) {
    if (username === 'admin') continue;

    const spec = walletSpecs.find((s) => s.username === username);
    const initialBalance = spec ? spec.topupAmount : 0;

    const [insertedWallet] = await tx
      .insert(wallets)
      .values({
        userId,
        balance: initialBalance,
      })
      .returning();

    walletMap.set(username, insertedWallet.id);

    // If there is a topup, record the transaction
    if (spec && spec.topupAmount > 0) {
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - 15); // 15 days ago

      const randomRef = '880' + Math.floor(1000000000 + Math.random() * 9000000000).toString();

      await tx.insert(walletTransactions).values({
        walletId: insertedWallet.id,
        amount: spec.topupAmount,
        type: 'topup',
        status: 'success',
        reference: randomRef,
        createdAt,
      });
    }
  }

  // 2. Seed Addresses
  for (const addr of rawAddresses) {
    const userId = userMap.get(addr.buyerUsername);
    if (!userId) continue;

    await tx.insert(addresses).values({
      userId,
      label: addr.label,
      recipientName: addr.recipientName,
      phoneNumber: addr.phoneNumber,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      postalCode: addr.postalCode,
      fullAddress: addr.fullAddress,
      isDefault: addr.isDefault,
    });
  }

  console.log(`Seeded wallets and ${rawAddresses.length} addresses successfully.`);
  return walletMap;
}
