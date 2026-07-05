export interface RawStore {
  sellerUsername: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  createdAtDaysAgo: number;
}

export const rawStores: RawStore[] = [
  {
    sellerUsername: 'budi_santoso',
    name: 'Toko Elektronik Budi',
    slug: 'toko-elektronik-budi',
    description:
      'Jual gadget & elektronik original bergaransi resmi. Pengiriman cepat dari Jakarta.',
    logoUrl:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 27,
  },
  {
    sellerUsername: 'aisyah_rahman',
    name: 'Fashion Corner ID',
    slug: 'fashion-corner-id',
    description: 'Trend fashion terkini untuk pria & wanita. Bahan berkualitas, harga bersahabat.',
    logoUrl:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 26,
  },
  {
    sellerUsername: 'dimas_el',
    name: 'Gadget Hub Store',
    slug: 'gadget-hub-store',
    description: 'One-stop solution untuk kebutuhan gadget kamu. Original 100%.',
    logoUrl:
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 25,
  },
  {
    sellerUsername: 'maya_kusuma',
    name: 'Maya Beauty Official',
    slug: 'maya-beauty-official',
    description: 'Beauty products original 100%. Terpercaya sejak 2023.',
    logoUrl:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 24,
  },
  {
    sellerUsername: 'fajar_nugroho',
    name: 'Rumah Tangga Shop',
    slug: 'rumah-tangga-shop',
    description: 'Perlengkapan rumah tangga berkualitas dengan harga terjangkau.',
    logoUrl:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 23,
  },
  {
    sellerUsername: 'rina_multi',
    name: "Rina's Multi Store",
    slug: 'rinas-multi-store',
    description: 'Toko serba ada untuk kebutuhan sehari-hari. Lengkap dan murah!',
    logoUrl:
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 22,
  },
];
