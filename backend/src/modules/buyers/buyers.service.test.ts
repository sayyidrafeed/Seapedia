import { describe, expect, test, mock, beforeEach } from 'bun:test';

// ─── Mock state ──────────────────────────────────────────────────────────────
const dbState = {
  selectQueue: [] as unknown[][],
  insertQueue: [] as unknown[][],
  updateQueue: [] as unknown[][],
  deleteQueue: [] as unknown[][],
  selectIdx: 0,
  insertIdx: 0,
  updateIdx: 0,
  deleteIdx: 0,

  reset() {
    this.selectQueue = [];
    this.insertQueue = [];
    this.updateQueue = [];
    this.deleteQueue = [];
    this.selectIdx = 0;
    this.insertIdx = 0;
    this.updateIdx = 0;
    this.deleteIdx = 0;
  },

  addSelect(data: unknown[]) {
    this.selectQueue.push(data);
  },
  addInsert(data: unknown[]) {
    this.insertQueue.push(data);
  },
  addUpdate(data: unknown[]) {
    this.updateQueue.push(data);
  },
  addDelete(data: unknown[]) {
    this.deleteQueue.push(data);
  },
};

// ─── Mock @/db ───────────────────────────────────────────────────────────────
mock.module('@/db', () => {
  function makeSelect() {
    return () => ({
      from: () => ({
        where: () => {
          const idx = dbState.selectIdx++;
          const data = dbState.selectQueue[idx] ?? [];
          return Object.assign(Promise.resolve(data), {
            limit: (n: number) => Promise.resolve(data.slice(0, n)),
            orderBy: () => Promise.resolve(data),
          });
        },
      }),
    });
  }

  function makeInsert() {
    return () => ({
      values: () => {
        const idx = dbState.insertIdx;
        return Object.assign(Promise.resolve(undefined), {
          returning: () => {
            dbState.insertIdx++;
            return Promise.resolve(dbState.insertQueue[idx] ?? []);
          },
        });
      },
    });
  }

  function makeUpdate() {
    return () => ({
      set: () => ({
        where: () => {
          const idx = dbState.updateIdx;
          return Object.assign(Promise.resolve(undefined), {
            returning: () => {
              dbState.updateIdx++;
              return Promise.resolve(dbState.updateQueue[idx] ?? []);
            },
          });
        },
      }),
    });
  }

  function makeDelete() {
    return () => ({
      where: () => {
        dbState.deleteIdx++;
        return Promise.resolve({ success: true });
      },
    });
  }

  const db = {
    select: makeSelect(),
    insert: makeInsert(),
    update: makeUpdate(),
    delete: makeDelete(),
    transaction: (fn: (tx: unknown) => unknown) => {
      const tx = {
        select: makeSelect(),
        insert: makeInsert(),
        update: makeUpdate(),
        delete: makeDelete(),
      };
      return fn(tx);
    },
  };

  return { db };
});

// ─── Import SUT ──────────────────────────────────────────────────────────────
import { BuyersService } from './buyers.service';

const userId = 'user-buyer-1';

describe('BuyersService', () => {
  beforeEach(() => {
    dbState.reset();
  });

  test('should get or create a wallet (creates new wallet)', async () => {
    // 1. select query returns no wallet
    dbState.addSelect([]);
    // 2. insert query returns new wallet
    dbState.addInsert([
      { id: 'wallet-1', userId, balance: 0, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const wallet = await BuyersService.getOrCreateWallet(userId);
    expect(wallet.id).toBe('wallet-1');
    expect(wallet.balance).toBe(0);
    expect(dbState.selectIdx).toBe(1);
    expect(dbState.insertIdx).toBe(1);
  });

  test('should get or create a wallet (returns existing wallet)', async () => {
    // 1. select query returns existing wallet
    dbState.addSelect([{ id: 'wallet-1', userId, balance: 150000 }]);

    const wallet = await BuyersService.getOrCreateWallet(userId);
    expect(wallet.id).toBe('wallet-1');
    expect(wallet.balance).toBe(150000);
    expect(dbState.selectIdx).toBe(1);
    expect(dbState.insertIdx).toBe(0); // no insert
  });

  test('should request a top up', async () => {
    // 1. getOrCreateWallet select
    dbState.addSelect([{ id: 'wallet-1', userId, balance: 0 }]);
    // 2. insert transaction
    dbState.addInsert([
      {
        id: 'tx-1',
        walletId: 'wallet-1',
        amount: 50000,
        type: 'topup',
        paymentMethod: 'BCA_VA',
        status: 'pending',
        reference: '8801234567',
        createdAt: new Date(),
      },
    ]);

    const result = await BuyersService.createTopUpRequest(userId, 50000, 'BCA_VA');
    expect(result.transaction.id).toBe('tx-1');
    expect(result.transaction.amount).toBe(50000);
    expect(result.paymentInstructions.virtualAccount).toBeDefined();
    expect(dbState.selectIdx).toBe(1);
    expect(dbState.insertIdx).toBe(1);
  });

  test('should simulate top up payment success', async () => {
    // 1. getOrCreateWallet select
    dbState.addSelect([{ id: 'wallet-1', userId, balance: 10000 }]);
    // 2. select transaction details
    dbState.addSelect([{ id: 'tx-1', walletId: 'wallet-1', amount: 50000, status: 'pending' }]);
    // 3. update transaction status
    dbState.addUpdate([{ id: 'tx-1', walletId: 'wallet-1', amount: 50000, status: 'success' }]);

    const successTx = await BuyersService.simulateTopUpPayment(userId, 'tx-1');
    expect(successTx.status).toBe('success');
    expect(dbState.selectIdx).toBe(2);
    expect(dbState.updateIdx).toBe(1); // Only the transaction update uses .returning()
  });

  test('should get wallet transactions', async () => {
    // 1. getOrCreateWallet select
    dbState.addSelect([{ id: 'wallet-1', userId, balance: 60000 }]);
    // 2. select transactions
    dbState.addSelect([
      {
        id: 'tx-1',
        walletId: 'wallet-1',
        amount: 50000,
        type: 'topup',
        status: 'success',
        createdAt: new Date(),
      },
    ]);

    const history = await BuyersService.getWalletTransactions(userId);
    expect(history.length).toBe(1);
    expect(history[0].id).toBe('tx-1');
  });

  test('should create address default if first address', async () => {
    // 1. getAddresses (returns empty)
    dbState.addSelect([]);
    // 2. insert address
    dbState.addInsert([
      {
        id: 'addr-1',
        userId,
        label: 'Home',
        recipientName: 'Alice',
        phoneNumber: '08123456789',
        province: 'DKI Jakarta',
        city: 'Jakarta Selatan',
        district: 'Kebayoran Baru',
        postalCode: '12110',
        fullAddress: 'Jl. Jenderal Sudirman No. 1',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const addr = await BuyersService.createAddress(userId, {
      label: 'Home',
      recipientName: 'Alice',
      phoneNumber: '08123456789',
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      district: 'Kebayoran Baru',
      postalCode: '12110',
      fullAddress: 'Jl. Jenderal Sudirman No. 1',
      isDefault: false,
    });

    expect(addr.isDefault).toBe(true); // forced default
    expect(dbState.selectIdx).toBe(1);
    expect(dbState.insertIdx).toBe(1);
  });
});
