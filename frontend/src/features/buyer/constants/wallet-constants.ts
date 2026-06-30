export const PRESET_AMOUNTS = [20000, 50000, 100000, 250000, 500000] as const;

export const PAYMENT_METHODS = [
  { id: 'BCA_VA', name: 'BCA Virtual Account', type: 'VA' },
  { id: 'MANDIRI_VA', name: 'Mandiri Virtual Account', type: 'VA' },
  { id: 'GOPAY', name: 'GoPay E-Wallet', type: 'E-WALLET' },
  { id: 'OVO', name: 'OVO E-Wallet', type: 'E-WALLET' },
] as const;
