export function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export interface DemoUser {
  username: string;
  email: string;
  password: string;
  name: string;
  roles: Array<'admin' | 'seller' | 'buyer' | 'driver'>;
  activeRole: 'admin' | 'seller' | 'buyer' | 'driver';
  isOnboarded: boolean;
}

export const DEMO_USERS: DemoUser[] = [
  {
    username: 'admin',
    email: 'admin@seapedia.com',
    password: 'admin123',
    name: 'System Administrator',
    roles: ['admin'],
    activeRole: 'admin',
    isOnboarded: true,
  },
  {
    username: 'seller1',
    email: 'seller1@seapedia.com',
    password: 'seller123',
    name: 'Ahmad Fauzi',
    roles: ['seller'],
    activeRole: 'seller',
    isOnboarded: true,
  },
  {
    username: 'buyer1',
    email: 'buyer1@seapedia.com',
    password: 'buyer123',
    name: 'Rina Wijaya',
    roles: ['buyer'],
    activeRole: 'buyer',
    isOnboarded: true,
  },
  {
    username: 'driver1',
    email: 'driver1@seapedia.com',
    password: 'driver123',
    name: 'Bambang Santoso',
    roles: ['driver'],
    activeRole: 'driver',
    isOnboarded: true,
  },
  {
    username: 'multirole',
    email: 'multirole@seapedia.com',
    password: 'multi123',
    name: 'Dian Permata',
    roles: ['seller', 'buyer', 'driver'],
    activeRole: 'seller',
    isOnboarded: true,
  },
];

export interface DemoStore {
  sellerUsername: string;
  name: string;
  slug: string;
  description: string;
}

export const DEMO_STORES: DemoStore[] = [
  {
    sellerUsername: 'seller1',
    name: 'Toko Elektronik Sejahtera',
    slug: 'toko-elektronik-sejahtera',
    description: 'Toko elektronik terpercaya menyediakan berbagai aksesoris gadget dan perlengkapan digital dengan kualitas terbaik.',
  },
  {
    sellerUsername: 'multirole',
    name: 'Fashion Modern',
    slug: 'fashion-modern',
    description: 'Toko fashion kekinian dengan koleksi pakaian, sepatu, dan aksesoris untuk pria dan wanita.',
  },
];

export interface DemoProduct {
  storeSlug: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  // Toko Elektronik Sejahtera
  {
    storeSlug: 'toko-elektronik-sejahtera',
    name: 'Headphone Bluetooth Pro',
    slug: 'headphone-bluetooth-pro',
    description: 'Headphone nirkabel dengan noise cancellation aktif, baterai tahan 30 jam, dan kualitas suara premium.',
    price: 250000,
    stock: 50,
  },
  {
    storeSlug: 'toko-elektronik-sejahtera',
    name: 'Mouse Wireless Gaming',
    slug: 'mouse-wireless-gaming',
    description: 'Mouse gaming wireless dengan sensor optik DPI 8000, 6 tombol programmable, dan RGB lighting.',
    price: 180000,
    stock: 30,
  },
  {
    storeSlug: 'toko-elektronik-sejahtera',
    name: 'Keyboard Mechanical RGB',
    slug: 'keyboard-mechanical-rgb',
    description: 'Keyboard mechanical dengan switch blue, backlight RGB per-key, dan full NKRO anti-ghosting.',
    price: 350000,
    stock: 25,
  },
  {
    storeSlug: 'toko-elektronik-sejahtera',
    name: 'Power Bank 20000mAh',
    slug: 'power-bank-20000mah',
    description: 'Power bank kapasitas 20000mAh dengan fast charging PD 20W, dual port, dan LED indikator.',
    price: 200000,
    stock: 40,
  },
  {
    storeSlug: 'toko-elektronik-sejahtera',
    name: 'USB-C Hub 7-in-1',
    slug: 'usb-c-hub-7-in-1',
    description: 'Hub USB-C 7 port dengan HDMI 4K, USB 3.0, SD card reader, dan PD charging passthrough.',
    price: 150000,
    stock: 35,
  },
  // Fashion Modern
  {
    storeSlug: 'fashion-modern',
    name: 'Kemeja Flannel Pria',
    slug: 'kemeja-flannel-pria',
    description: 'Kemeja flannel kotak-kotak bahan katun premium, nyaman dipakai sehari-hari, cocok untuk gaya kasual.',
    price: 120000,
    stock: 40,
  },
  {
    storeSlug: 'fashion-modern',
    name: 'Jaket Denim Wanita',
    slug: 'jaket-denim-wanita',
    description: 'Jaket denim trendy dengan bahan tebal dan nyaman, model oversized, cocok untuk berbagai aktivitas.',
    price: 275000,
    stock: 20,
  },
  {
    storeSlug: 'fashion-modern',
    name: 'Sepatu Sneakers Casual',
    slug: 'sepatu-sneakers-casual',
    description: 'Sepatu sneakers casual style terkini, sol karet anti-slip, insole empuk, tersedia berbagai ukuran.',
    price: 320000,
    stock: 15,
  },
  {
    storeSlug: 'fashion-modern',
    name: 'Tas Ransel Kanvas',
    slug: 'tas-ransel-kanvas',
    description: 'Tas ransel kanvas vintage serbaguna, kompartemen laptop, tali bahu empuk, cocok untuk traveling.',
    price: 180000,
    stock: 25,
  },
  {
    storeSlug: 'fashion-modern',
    name: 'Jam Tangan Analog',
    slug: 'jam-tangan-analog',
    description: 'Jam tangan analog dengan leather strap, movement quartz, water resistant 30M, tampilan klasik elegan.',
    price: 250000,
    stock: 30,
  },
];

export interface DemoWallet {
  username: string;
  balance: number;
}

export const DEMO_WALLETS: DemoWallet[] = [
  { username: 'buyer1', balance: 500000 },
  { username: 'multirole', balance: 250000 },
];

export interface DemoTransaction {
  username: string;
  amount: number;
  type: 'topup' | 'payment' | 'refund';
  paymentMethod: string;
  status: 'pending' | 'success' | 'failed';
  reference: string;
}

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  {
    username: 'buyer1',
    amount: 500000,
    type: 'topup',
    paymentMethod: 'BCA_VA',
    status: 'success',
    reference: 'VA-1234567890',
  },
  {
    username: 'buyer1',
    amount: 200000,
    type: 'topup',
    paymentMethod: 'GOPAY',
    status: 'success',
    reference: 'GP-9876543210',
  },
  {
    username: 'multirole',
    amount: 250000,
    type: 'topup',
    paymentMethod: 'MANDIRI_VA',
    status: 'success',
    reference: 'VA-5555555555',
  },
];

export interface DemoAddress {
  username: string;
  label: string;
  recipientName: string;
  phoneNumber: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  fullAddress: string;
  isDefault: boolean;
}

export const DEMO_ADDRESSES: DemoAddress[] = [
  {
    username: 'buyer1',
    label: 'Rumah',
    recipientName: 'Rina Wijaya',
    phoneNumber: '081234567890',
    province: 'DKI Jakarta',
    city: 'Jakarta Pusat',
    district: 'Menteng',
    postalCode: '10310',
    fullAddress: 'Jl. Merdeka No. 123, RT 05 RW 03, Kel. Menteng',
    isDefault: true,
  },
  {
    username: 'buyer1',
    label: 'Kantor',
    recipientName: 'Rina Wijaya',
    phoneNumber: '081234567891',
    province: 'DKI Jakarta',
    city: 'Jakarta Selatan',
    district: 'Sudirman',
    postalCode: '12190',
    fullAddress: 'Jl. Jenderal Sudirman No. 45, Gedung Pusat Niaga Lantai 8',
    isDefault: false,
  },
  {
    username: 'multirole',
    label: 'Rumah',
    recipientName: 'Dian Permata',
    phoneNumber: '085678901234',
    province: 'Jawa Barat',
    city: 'Bandung',
    district: 'Coblong',
    postalCode: '40132',
    fullAddress: 'Jl. Diponegoro No. 67, Kel. Lebak Siliwangi',
    isDefault: true,
  },
];

export interface DemoCart {
  username: string;
  storeSlug: string;
}

export const DEMO_CARTS: DemoCart[] = [
  { username: 'buyer1', storeSlug: 'toko-elektronik-sejahtera' },
  { username: 'multirole', storeSlug: 'fashion-modern' },
];

export interface DemoCartItem {
  username: string;
  productSlug: string;
  quantity: number;
}

export const DEMO_CART_ITEMS: DemoCartItem[] = [
  { username: 'buyer1', productSlug: 'power-bank-20000mah', quantity: 1 },
  { username: 'buyer1', productSlug: 'usb-c-hub-7-in-1', quantity: 1 },
  { username: 'multirole', productSlug: 'tas-ransel-kanvas', quantity: 2 },
];

export interface DemoOrder {
  ref: string;
  buyerUsername: string;
  storeSlug: string;
  deliveryMethod: 'instant' | 'next_day' | 'regular';
  subtotal: number;
  discountAmount: number;
  discountCode: string | null;
  discountType: 'voucher' | 'promo' | null;
  deliveryFee: number;
  ppn: number;
  totalAmount: number;
  status: string;
  addressIndex: number;
}

export const DEMO_ORDERS: DemoOrder[] = [
  {
    ref: 'order-1',
    buyerUsername: 'buyer1',
    storeSlug: 'toko-elektronik-sejahtera',
    deliveryMethod: 'instant',
    subtotal: 400000,
    discountAmount: 0,
    discountCode: null,
    discountType: null,
    deliveryFee: 20000,
    ppn: 50400,
    totalAmount: 470400,
    status: 'sedang_dikemas',
    addressIndex: 0,
  },
  {
    ref: 'order-2',
    buyerUsername: 'buyer1',
    storeSlug: 'toko-elektronik-sejahtera',
    deliveryMethod: 'regular',
    subtotal: 360000,
    discountAmount: 0,
    discountCode: null,
    discountType: null,
    deliveryFee: 5000,
    ppn: 43800,
    totalAmount: 408800,
    status: 'menunggu_pengirim',
    addressIndex: 0,
  },
  {
    ref: 'order-3',
    buyerUsername: 'buyer1',
    storeSlug: 'toko-elektronik-sejahtera',
    deliveryMethod: 'next_day',
    subtotal: 530000,
    discountAmount: 10000,
    discountCode: 'HEMAT10',
    discountType: 'voucher',
    deliveryFee: 10000,
    ppn: 63600,
    totalAmount: 593600,
    status: 'sedang_dikirim',
    addressIndex: 1,
  },
  {
    ref: 'order-4',
    buyerUsername: 'multirole',
    storeSlug: 'fashion-modern',
    deliveryMethod: 'regular',
    subtotal: 275000,
    discountAmount: 0,
    discountCode: null,
    discountType: null,
    deliveryFee: 5000,
    ppn: 33600,
    totalAmount: 313600,
    status: 'pesanan_selesai',
    addressIndex: 2,
  },
  {
    ref: 'order-5',
    buyerUsername: 'multirole',
    storeSlug: 'fashion-modern',
    deliveryMethod: 'instant',
    subtotal: 500000,
    discountAmount: 10000,
    discountCode: 'HEMAT10',
    discountType: 'voucher',
    deliveryFee: 20000,
    ppn: 61200,
    totalAmount: 571200,
    status: 'sedang_dikemas',
    addressIndex: 2,
  },
  {
    ref: 'order-6',
    buyerUsername: 'buyer1',
    storeSlug: 'toko-elektronik-sejahtera',
    deliveryMethod: 'regular',
    subtotal: 200000,
    discountAmount: 0,
    discountCode: null,
    discountType: null,
    deliveryFee: 5000,
    ppn: 24600,
    totalAmount: 229600,
    status: 'dikembalikan',
    addressIndex: 0,
  },
];

export interface DemoOrderItem {
  orderRef: string;
  productSlug: string;
  productName: string;
  productPrice: number;
  quantity: number;
}

export const DEMO_ORDER_ITEMS: DemoOrderItem[] = [
  { orderRef: 'order-1', productSlug: 'headphone-bluetooth-pro', productName: 'Headphone Bluetooth Pro', productPrice: 250000, quantity: 1 },
  { orderRef: 'order-1', productSlug: 'usb-c-hub-7-in-1', productName: 'USB-C Hub 7-in-1', productPrice: 150000, quantity: 1 },
  { orderRef: 'order-2', productSlug: 'mouse-wireless-gaming', productName: 'Mouse Wireless Gaming', productPrice: 180000, quantity: 2 },
  { orderRef: 'order-3', productSlug: 'keyboard-mechanical-rgb', productName: 'Keyboard Mechanical RGB', productPrice: 350000, quantity: 1 },
  { orderRef: 'order-3', productSlug: 'mouse-wireless-gaming', productName: 'Mouse Wireless Gaming', productPrice: 180000, quantity: 1 },
  { orderRef: 'order-4', productSlug: 'jaket-denim-wanita', productName: 'Jaket Denim Wanita', productPrice: 275000, quantity: 1 },
  { orderRef: 'order-5', productSlug: 'sepatu-sneakers-casual', productName: 'Sepatu Sneakers Casual', productPrice: 320000, quantity: 1 },
  { orderRef: 'order-5', productSlug: 'tas-ransel-kanvas', productName: 'Tas Ransel Kanvas', productPrice: 180000, quantity: 1 },
  { orderRef: 'order-6', productSlug: 'power-bank-20000mah', productName: 'Power Bank 20000mAh', productPrice: 200000, quantity: 1 },
];

export interface DemoStatusHistory {
  orderRef: string;
  status: string;
  note: string | null;
}

export const DEMO_STATUS_HISTORY: DemoStatusHistory[] = [
  { orderRef: 'order-1', status: 'sedang_dikemas', note: 'Pesanan sedang diproses penjual' },
  { orderRef: 'order-2', status: 'sedang_dikemas', note: 'Pesanan sudah dikemas, menunggu pickup kurir' },
  { orderRef: 'order-2', status: 'menunggu_pengirim', note: null },
  { orderRef: 'order-3', status: 'sedang_dikemas', note: 'Pesanan sedang diproses penjual' },
  { orderRef: 'order-3', status: 'menunggu_pengirim', note: 'Pesanan menunggu diambil kurir' },
  { orderRef: 'order-3', status: 'sedang_dikirim', note: 'Pesanan sedang dalam perjalanan' },
  { orderRef: 'order-4', status: 'sedang_dikemas', note: 'Pesanan sedang diproses penjual' },
  { orderRef: 'order-4', status: 'menunggu_pengirim', note: null },
  { orderRef: 'order-4', status: 'sedang_dikirim', note: 'Pesanan sedang dalam perjalanan' },
  { orderRef: 'order-4', status: 'pesanan_selesai', note: 'Pesanan telah diterima pembeli' },
  { orderRef: 'order-5', status: 'sedang_dikemas', note: 'Pesanan sedang diproses' },
  { orderRef: 'order-6', status: 'sedang_dikemas', note: 'Pesanan sedang diproses penjual' },
  { orderRef: 'order-6', status: 'dikembalikan', note: 'Pesanan melebihi batas waktu pengiriman, otomatis dikembalikan' },
];

export interface DemoVoucher {
  code: string;
  discountAmount: number;
  minOrderAmount: number;
  expiresAt: Date;
  remainingUsage: number;
}

export const DEMO_VOUCHERS: DemoVoucher[] = [
  {
    code: 'HEMAT10',
    discountAmount: 10000,
    minOrderAmount: 50000,
    expiresAt: daysFromNow(30),
    remainingUsage: 50,
  },
  {
    code: 'FLASHSALE',
    discountAmount: 25000,
    minOrderAmount: 100000,
    expiresAt: daysFromNow(-1),
    remainingUsage: 0,
  },
];

export interface DemoPromo {
  code: string;
  discountPercent: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  expiresAt: Date;
}

export const DEMO_PROMOS: DemoPromo[] = [
  {
    code: 'MERDEKA18',
    discountPercent: 18,
    maxDiscountAmount: 30000,
    minOrderAmount: 75000,
    expiresAt: daysFromNow(30),
  },
];

export interface DemoDeliveryJob {
  orderRef: string;
  driverUsername: string | null;
  status: 'pending' | 'taken' | 'completed';
  deliveryFee: number;
}

export const DEMO_DELIVERY_JOBS: DemoDeliveryJob[] = [
  { orderRef: 'order-3', driverUsername: 'driver1', status: 'taken', deliveryFee: 10000 },
  { orderRef: 'order-4', driverUsername: 'driver1', status: 'completed', deliveryFee: 5000 },
  { orderRef: 'order-2', driverUsername: null, status: 'pending', deliveryFee: 5000 },
];

export interface DemoReview {
  reviewerName: string;
  rating: number;
  comment: string;
}

export const DEMO_REVIEWS: DemoReview[] = [
  {
    reviewerName: 'Budi Santoso',
    rating: 5,
    comment: 'Aplikasi sangat membantu! Barang sampai tepat waktu dan kualitas sesuai deskripsi.',
  },
  {
    reviewerName: 'Siti Nurhayati',
    rating: 4,
    comment: 'Cukup bagus, tapi pengiriman agak lambat untuk metode reguler. Tapi barangnya ok.',
  },
  {
    reviewerName: 'Andi Pratama',
    rating: 3,
    comment: 'Masih ada bug di bagian checkout, tapi overall lumayan untuk marketplace baru.',
  },
  {
    reviewerName: 'Dewi Lestari',
    rating: 5,
    comment: 'Suka banget sama fitur multi-role! Bisa jadi pembeli sekaligus penjual dalam satu akun.',
  },
  {
    reviewerName: 'Rudi Hermawan',
    rating: 4,
    comment: 'Dashboard driver-nya informatif, tapi希望 ada notifikasi real-time untuk order baru.',
  },
];
