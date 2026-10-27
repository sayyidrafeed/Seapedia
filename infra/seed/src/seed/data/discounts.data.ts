export interface RawVoucher {
  code: string;
  discountAmount: number;
  minOrderAmount: number;
  expiresInDays: number;
  remainingUsage: number;
}

export interface RawPromo {
  code: string;
  discountPercent: number;
  maxDiscountAmount: number;
  minOrderAmount: number;
  expiresInDays: number;
}

export const rawVouchers: RawVoucher[] = [
  {
    code: 'HEMAT10K',
    discountAmount: 10000,
    minOrderAmount: 50000,
    expiresInDays: 30,
    remainingUsage: 45,
  },
  {
    code: 'HEMAT25K',
    discountAmount: 25000,
    minOrderAmount: 100000,
    expiresInDays: 25,
    remainingUsage: 70,
  },
  {
    code: 'HEMAT50K',
    discountAmount: 50000,
    minOrderAmount: 200000,
    expiresInDays: 20,
    remainingUsage: 85,
  },
  {
    code: 'GRATIS100K',
    discountAmount: 100000,
    minOrderAmount: 500000,
    expiresInDays: 15,
    remainingUsage: 95,
  },
  {
    code: 'NEWUSER15K',
    discountAmount: 15000,
    minOrderAmount: 75000,
    expiresInDays: 60,
    remainingUsage: 60,
  },
  {
    code: 'FLASH20K',
    discountAmount: 20000,
    minOrderAmount: 150000,
    expiresInDays: 7,
    remainingUsage: 30,
  },
  {
    code: 'WEEKEND30K',
    discountAmount: 30000,
    minOrderAmount: 250000,
    expiresInDays: 10,
    remainingUsage: 50,
  },
  {
    code: 'BONUS5K',
    discountAmount: 5000,
    minOrderAmount: 25000,
    expiresInDays: 45,
    remainingUsage: 80,
  },
];

export const rawPromos: RawPromo[] = [
  {
    code: 'PROMO10',
    discountPercent: 10,
    maxDiscountAmount: 50000,
    minOrderAmount: 100000,
    expiresInDays: 30,
  },
  {
    code: 'PROMO20',
    discountPercent: 20,
    maxDiscountAmount: 75000,
    minOrderAmount: 200000,
    expiresInDays: 20,
  },
  {
    code: 'MEGA25',
    discountPercent: 25,
    maxDiscountAmount: 100000,
    minOrderAmount: 300000,
    expiresInDays: 15,
  },
  {
    code: 'SALE15',
    discountPercent: 15,
    maxDiscountAmount: 40000,
    minOrderAmount: 75000,
    expiresInDays: 25,
  },
];
