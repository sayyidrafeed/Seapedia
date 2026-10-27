/* eslint-disable max-lines */
export interface RawProduct {
  storeSlug: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  soldCount: number;
  rating: string;
  description: string;
  imageUrl: string;
}

export const rawProducts: RawProduct[] = [
  // Toko Elektronik Budi (12 products)
  {
    storeSlug: 'toko-elektronik-budi',
    name: 'Samsung Galaxy A15 8/256GB',
    slug: 'samsung-galaxy-a15',
    price: 2899000,
    stock: 45,
    soldCount: 23,
    rating: '4.80',
    description:
      'Samsung Galaxy A15 dengan RAM 8GB dan memori internal 256GB. Layar Super AMOLED 90Hz, kamera 50MP, baterai 5000mAh dengan pengisian cepat 25W. Garansi resmi SEIN.',
    imageUrl:
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'toko-elektronik-budi',
    name: 'iPhone 15 128GB',
    slug: 'iphone-15-128gb',
    price: 12999000,
    stock: 20,
    soldCount: 8,
    rating: '4.90',
    description:
      'Apple iPhone 15 kapasitas 128GB. Dilengkapi dengan Dynamic Island, kamera utama 48MP, chip A16 Bionic, dan port USB-C. Garansi resmi iBox Indonesia.',
    imageUrl:
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'toko-elektronik-budi',
    name: 'ASUS Vivobook 14 M1402',
    slug: 'asus-vivobook-14-m1402',
    price: 6499000,
    stock: 15,
    soldCount: 5,
    rating: '4.70',
    description:
      'ASUS Vivobook 14 ditenagai prosesor AMD Ryzen 3, RAM 8GB DDR4, SSD 512GB NVMe. Layar FHD 14 inci, Windows 11 Home + Office Home & Student asli.',
    imageUrl:
      'https://images.unsplash.com/photo-1496181130204-7552cc14ac1a?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'toko-elektronik-budi',
    name: 'TWS Samsung Galaxy Buds FE',
    slug: 'tws-samsung-galaxy-buds-fe',
    price: 899000,
    stock: 50,
    soldCount: 31,
    rating: '4.60',
    description:
      'Samsung Galaxy Buds FE menghadirkan Active Noise Canceling (ANC) luar biasa, desain ergonomis, baterai tahan lama, dan integrasi ekosistem Galaxy yang mulus.',
    imageUrl:
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'toko-elektronik-budi',
    name: 'Power Bank Anker 20000mAh',
    slug: 'power-bank-anker-20000mah',
    price: 349000,
    stock: 60,
    soldCount: 42,
    rating: '4.80',
    description:
      'Anker PowerCore 20000mAh dengan PowerIQ untuk pengisian daya ekstra cepat dan aman. Kapasitas besar dapat mengisi daya smartphone hingga 4-5 kali.',
    imageUrl:
      'https://images.unsplash.com/photo-1609592424109-dd9892f1b17c?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'toko-elektronik-budi',
    name: 'HP Laser Printer Brother',
    slug: 'hp-laser-printer-brother',
    price: 1899000,
    stock: 10,
    soldCount: 3,
    rating: '4.50',
    description:
      'Printer Brother Laser Monokrom dengan fitur print, copy, scan dan konektivitas nirkabel. Kecepatan cetak tinggi dan sangat hemat toner.',
    imageUrl:
      'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'toko-elektronik-budi',
    name: 'Logitech Wireless Mouse M331',
    slug: 'logitech-wireless-mouse-m331',
    price: 149000,
    stock: 80,
    soldCount: 55,
    rating: '4.70',
    description:
      'Logitech M331 Silent Plus wireless mouse. Nikmati keheningan dengan pengurangan suara klik hingga 90% tanpa mengurangi kenyamanan klik.',
    imageUrl:
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'toko-elektronik-budi',
    name: 'USB-C Hub 7 in 1',
    slug: 'usb-c-hub-7-in-1',
    price: 189000,
    stock: 40,
    soldCount: 18,
    rating: '4.40',
    description:
      'Adapter USB Type C Hub 7 in 1 dengan port HDMI 4K, card reader SD/TF, USB 3.0, dan Power Delivery untuk MacBook atau laptop modern lainnya.',
    imageUrl:
      'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'toko-elektronik-budi',
    name: 'Webcam Logitech C920 HD',
    slug: 'webcam-logitech-c920-hd',
    price: 899000,
    stock: 25,
    soldCount: 12,
    rating: '4.60',
    description:
      'Logitech C920 Pro HD Webcam menyajikan panggilan video Full HD 1080p yang jernih dengan audio stereo ganda dan koreksi cahaya otomatis.',
    imageUrl:
      'https://images.unsplash.com/photo-1600541519463-ee3745d04c5f?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'toko-elektronik-budi',
    name: 'Keyboard Mechanical Redragon',
    slug: 'keyboard-mechanical-redragon',
    price: 349000,
    stock: 35,
    soldCount: 22,
    rating: '4.50',
    description:
      'Redragon Mechanical Gaming Keyboard dengan switch responsif, lampu latar RGB yang dinamis, andal untuk gaming maupun mengetik sehari-hari.',
    imageUrl:
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'toko-elektronik-budi',
    name: 'Headset Gaming HyperX Cloud',
    slug: 'headset-gaming-hyperx-cloud',
    price: 599000,
    stock: 30,
    soldCount: 15,
    rating: '4.70',
    description:
      'HyperX Cloud Stinger Gaming Headset dengan busa memori khas HyperX, driver 50mm yang presisi, dan mikrofon noise-cancelling putar untuk mute.',
    imageUrl:
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'toko-elektronik-budi',
    name: 'Kabel Lightning Original Apple',
    slug: 'kabel-lightning-original-apple',
    price: 199000,
    stock: 100,
    soldCount: 67,
    rating: '4.80',
    description:
      'Kabel charger Apple Lightning ke USB 1 meter original. Menjamin pengisian daya aman dan transfer data stabil untuk perangkat Apple Anda.',
    imageUrl:
      'https://images.unsplash.com/photo-1541667590928-bb37e2f1847e?w=400&auto=format&fit=crop&q=80',
  },

  // Fashion Corner ID (11 products)
  {
    storeSlug: 'fashion-corner-id',
    name: 'Kaos Polos Cotton Combed 30s',
    slug: 'kaos-polos-combed',
    price: 59000,
    stock: 200,
    soldCount: 145,
    rating: '4.60',
    description:
      'Kaos polos premium berbahan 100% Cotton Combed 30s. Sangat lembut, menyerap keringat dengan baik, dan adem dipakai seharian. Unisex.',
    imageUrl:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'fashion-corner-id',
    name: 'Jaket Hoodie Pria Premium',
    slug: 'jaket-hoodie-pria',
    price: 189000,
    stock: 75,
    soldCount: 38,
    rating: '4.50',
    description:
      'Jaket hoodie fleece tebal dan lembut dengan kantong kanguru. Cocok untuk cuaca dingin maupun berkendara motor.',
    imageUrl:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'fashion-corner-id',
    name: 'Sneakers Nike Air Max 270',
    slug: 'sneakers-nike-air-max-270',
    price: 1599000,
    stock: 30,
    soldCount: 12,
    rating: '4.80',
    description:
      'Sepatu sneakers original Nike Air Max 270. Desain stylish, sol udara ekstra nyaman untuk olahraga ringan maupun gaya kasual.',
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'fashion-corner-id',
    name: 'Jeans Slim Fit Denim Original',
    slug: 'jeans-slim-fit-denim',
    price: 179000,
    stock: 60,
    soldCount: 28,
    rating: '4.40',
    description:
      'Celana panjang jeans pria model slim fit dengan bahan stretch denim berkualitas. Jahitan rapi, awet, dan nyaman bergerak.',
    imageUrl:
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'fashion-corner-id',
    name: 'Dress Casual Wanita Lengan Panjang',
    slug: 'dress-casual-wanita',
    price: 149000,
    stock: 50,
    soldCount: 22,
    rating: '4.50',
    description:
      'Casual dress wanita lengan panjang, bahan knit elastis premium. Cocok untuk acara formal ringan maupun hangout kasual.',
    imageUrl:
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'fashion-corner-id',
    name: 'Celana Chino Pria Katun',
    slug: 'celana-chino-pria',
    price: 129000,
    stock: 80,
    soldCount: 45,
    rating: '4.60',
    description:
      'Celana panjang chino pria bahan katun twill tebal dan melar sedikit. Tersedia dalam berbagai warna netral.',
    imageUrl:
      'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'fashion-corner-id',
    name: 'Tas Selempang Pria Kulit',
    slug: 'tas-selempang-pria',
    price: 249000,
    stock: 40,
    soldCount: 18,
    rating: '4.30',
    description:
      'Tas selempang (sling bag) pria bahan kulit sintetis PU tebal dengan resleting anti air. Memiliki banyak kompartemen.',
    imageUrl:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'fashion-corner-id',
    name: 'Jam Tangan Casio G-Shock',
    slug: 'jam-tangan-g-shock',
    price: 899000,
    stock: 25,
    soldCount: 9,
    rating: '4.90',
    description:
      'Jam tangan sport outdoor Casio G-Shock original. Tahan guncangan, tahan air hingga 200m, dilengkapi stopwatch dan alarm.',
    imageUrl:
      'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'fashion-corner-id',
    name: 'Kacamata Polarized UV400',
    slug: 'kacamata-polarized-uv400',
    price: 89000,
    stock: 90,
    soldCount: 52,
    rating: '4.40',
    description:
      'Kacamata hitam polarized UV400 untuk perlindungan mata maksimal dari sinar matahari langsung saat berkendara atau liburan.',
    imageUrl:
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'fashion-corner-id',
    name: 'Sabuk Kulit Pria Premium',
    slug: 'sabuk-kulit-pria',
    price: 79000,
    stock: 70,
    soldCount: 33,
    rating: '4.50',
    description:
      'Ikat pinggang pria bahan kulit sapi asli dengan kepala sabuk otomatis dari alloy steel anti karat.',
    imageUrl:
      'https://images.unsplash.com/photo-1624222247566-7f824026847b?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'fashion-corner-id',
    name: 'Scarf Wanita Motif Bunga',
    slug: 'scarf-wanita-motif',
    price: 49000,
    stock: 120,
    soldCount: 68,
    rating: '4.60',
    description:
      'Syal / hijab scarf wanita motif bunga cantik dengan bahan katun voal halus, tidak terawang, dan mudah dibentuk.',
    imageUrl:
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&auto=format&fit=crop&q=80',
  },

  // Gadget Hub Store (10 products)
  {
    storeSlug: 'gadget-hub-store',
    name: 'Xiaomi Redmi Note 13 Pro',
    slug: 'xiaomi-redmi-note-13-pro',
    price: 3299000,
    stock: 35,
    soldCount: 18,
    rating: '4.70',
    description:
      'Redmi Note 13 Pro dengan kamera ultra-clear 200MP, layar AMOLED 120Hz, dan pengisian daya turbo 67W. Garansi resmi Xiaomi Indonesia.',
    imageUrl:
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'gadget-hub-store',
    name: 'Realme GT Neo 5 SE',
    slug: 'realme-gt-neo-5-se',
    price: 4199000,
    stock: 25,
    soldCount: 11,
    rating: '4.60',
    description:
      'Realme GT Neo 5 SE ditenagai chipset Snapdragon 7+ Gen 2 yang sangat kencang, RAM besar, dan layar 144Hz. Handphone gaming terbaik dikelasnya.',
    imageUrl:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'gadget-hub-store',
    name: 'iPad 10th Gen 64GB',
    slug: 'ipad-10th-gen-64gb',
    price: 6499000,
    stock: 15,
    soldCount: 6,
    rating: '4.80',
    description:
      'Apple iPad generasi ke-10 dengan layar Liquid Retina 10.9 inci, chip A14 Bionic, dan port USB-C. Cocok untuk produktivitas maupun hiburan.',
    imageUrl:
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'gadget-hub-store',
    name: 'Smart Watch Amazfit GTR 4',
    slug: 'smart-watch-amazfit-gtr-4',
    price: 2199000,
    stock: 30,
    soldCount: 14,
    rating: '4.50',
    description:
      'Amazfit GTR 4 Smartwatch GPS olahraga dengan sensor bio-tracking canggih, layar AMOLED bulat klasik, dan baterai tahan hingga 14 hari.',
    imageUrl:
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'gadget-hub-store',
    name: 'Speaker JBL Flip 6',
    slug: 'speaker-jbl-flip-6',
    price: 1599000,
    stock: 40,
    soldCount: 21,
    rating: '4.70',
    description:
      'JBL Flip 6 Speaker Bluetooth Portabel tahan air (IP67) dengan suara bass kencang dan jernih khas JBL Original Pro Sound.',
    imageUrl:
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'gadget-hub-store',
    name: 'SSD Samsung 980 Pro 1TB',
    slug: 'ssd-samsung-980-pro-1tb',
    price: 1499000,
    stock: 50,
    soldCount: 28,
    rating: '4.80',
    description:
      'SSD NVMe PCIe 4.0 Samsung 980 Pro kapasitas 1TB. Kecepatan baca super tinggi hingga 7000MB/s untuk PC gaming dan PS5.',
    imageUrl:
      'https://images.unsplash.com/photo-1618532150248-9e7f8a4941f8?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'gadget-hub-store',
    name: 'RAM Corsair 16GB DDR5',
    slug: 'ram-corsair-16gb-ddr5',
    price: 899000,
    stock: 45,
    soldCount: 19,
    rating: '4.60',
    description:
      'Corsair Vengeance DDR5 16GB (2x8GB) 5200MHz. Memberikan frekuensi lebih tinggi, performa lebih cepat, dan stabilitas luar biasa untuk PC desktop modern.',
    imageUrl:
      'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'gadget-hub-store',
    name: 'Monitor LG 24 inch IPS',
    slug: 'monitor-lg-24-inch-ips',
    price: 2199000,
    stock: 20,
    soldCount: 7,
    rating: '4.50',
    description:
      'Monitor LG Full HD 24 inci dengan panel IPS, refresh rate 75Hz, AMD FreeSync, dan desain bezel-less yang minimalis.',
    imageUrl:
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'gadget-hub-store',
    name: 'Keyboard Logitech K380',
    slug: 'keyboard-logitech-k380',
    price: 399000,
    stock: 60,
    soldCount: 35,
    rating: '4.70',
    description:
      'Logitech K380 Multi-Device Bluetooth Keyboard. Ringan, ringkas, dan bisa disambungkan ke 3 perangkat sekaligus (HP, laptop, tablet).',
    imageUrl:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'gadget-hub-store',
    name: 'Mousepad Gaming XL',
    slug: 'mousepad-gaming-xl',
    price: 89000,
    stock: 100,
    soldCount: 58,
    rating: '4.50',
    description:
      'Mousepad gaming ukuran besar (800x300mm) dengan bahan kain halus, jahitan tepi tebal, dan alas karet anti-selip.',
    imageUrl:
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&auto=format&fit=crop&q=80',
  },

  // Maya Beauty Official (10 products)
  {
    storeSlug: 'maya-beauty-official',
    name: 'Serum Vitamin C Brightening',
    slug: 'serum-vitamin-c',
    price: 89000,
    stock: 100,
    soldCount: 72,
    rating: '4.80',
    description:
      'Serum Vitamin C murni untuk mencerahkan noda hitam kulit, menyamarkan bekas jerawat, dan meratakan warna kulit wajah.',
    imageUrl:
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'maya-beauty-official',
    name: 'Sunscreen SPF 50 PA++++',
    slug: 'sunscreen-spf50',
    price: 65000,
    stock: 150,
    soldCount: 98,
    rating: '4.70',
    description:
      'Sunscreen gel ringan dengan perlindungan tinggi SPF 50 PA++++ terhadap sinar UVA/UVB tanpa meninggalkan whitecast.',
    imageUrl:
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'maya-beauty-official',
    name: 'Lip Tint Wardah Longstay',
    slug: 'lip-tint-wardah',
    price: 42000,
    stock: 200,
    soldCount: 135,
    rating: '4.60',
    description:
      'Wardah Everyday Cheek & Lip Tint, formula ringan dengan ekstrak lidah buaya yang melembabkan bibir sepanjang hari.',
    imageUrl:
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'maya-beauty-official',
    name: 'Moisturizer Gel Aloe Vera',
    slug: 'moisturizer-gel-aloe-vera',
    price: 55000,
    stock: 120,
    soldCount: 85,
    rating: '4.50',
    description:
      'Gel lidah buaya 99% serbaguna untuk melembabkan kulit kering, meredakan kemerahan akibat sengatan matahari, dan menutrisi ujung rambut.',
    imageUrl:
      'https://images.unsplash.com/photo-1556229174-5e42a09e45af?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'maya-beauty-official',
    name: 'Hair Serum Oil Repair',
    slug: 'hair-serum-oil-repair',
    price: 78000,
    stock: 80,
    soldCount: 45,
    rating: '4.40',
    description:
      'Minyak serum rambut mengandung argan oil untuk mengatasi rambut bercabang, kusam, kusut, dan melindungi rambut dari panas hair dryer.',
    imageUrl:
      'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'maya-beauty-official',
    name: 'Face Wash Gentle Foam',
    slug: 'face-wash-gentle-foam',
    price: 35000,
    stock: 180,
    soldCount: 112,
    rating: '4.60',
    description:
      'Sabun cuci muka busa lembut non-SLS untuk kulit sensitif dan kering. Membersihkan debu dan minyak secara menyeluruh tanpa efek ketarik.',
    imageUrl:
      'https://images.unsplash.com/photo-1608248597481-496100c8c836?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'maya-beauty-official',
    name: 'Toner Rose Water Original',
    slug: 'toner-rose-water',
    price: 45000,
    stock: 90,
    soldCount: 58,
    rating: '4.50',
    description:
      'Penyegar wajah air mawar alami yang membantu mengecilkan pori-pori, melembabkan wajah seketika, dan menyegarkan tampilan make-up.',
    imageUrl:
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'maya-beauty-official',
    name: 'Masker Wajah Collagen',
    slug: 'masker-wajah-collagen',
    price: 28000,
    stock: 250,
    soldCount: 165,
    rating: '4.70',
    description:
      'Masker wajah lembaran (sheet mask) dengan kandungan kolagen alami untuk elastisitas, mengencangkan, dan meremajakan kulit wajah.',
    imageUrl:
      'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'maya-beauty-official',
    name: 'Body Lotion Whitening',
    slug: 'body-lotion-whitening',
    price: 52000,
    stock: 110,
    soldCount: 78,
    rating: '4.40',
    description:
      'Lotion pelembab tubuh dengan glutathione dan vitamin E untuk mencerahkan kulit secara instan serta melindungi dari polusi udara.',
    imageUrl:
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'maya-beauty-official',
    name: 'Parfum Local Premium 30ml',
    slug: 'parfum-local-premium',
    price: 99000,
    stock: 60,
    soldCount: 32,
    rating: '4.60',
    description:
      'Parfum lokal premium wangi manis vanila berpadu dengan buah-buahan segar. Tahan hingga 8-12 jam di pakaian.',
    imageUrl:
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&auto=format&fit=crop&q=80',
  },

  // Rumah Tangga Shop (10 products)
  {
    storeSlug: 'rumah-tangga-shop',
    name: 'Rice Cooker Miyako 1.8L',
    slug: 'rice-cooker-miyako-18l',
    price: 299000,
    stock: 40,
    soldCount: 22,
    rating: '4.50',
    description:
      'Miyako Magic Warmer Plus Rice Cooker penanak nasi kapasitas 1.8 liter dengan panci antilengket food grade. Desain cantik bermotif.',
    imageUrl:
      'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rumah-tangga-shop',
    name: 'Blender Philips HR2223',
    slug: 'blender-philips-hr2223',
    price: 599000,
    stock: 25,
    soldCount: 11,
    rating: '4.70',
    description:
      'Philips Blender plastik kapasitas 2 liter dengan pisau kuat penghancur es batu secara sempurna. Dilengkapi aksesoris chopper dan filter.',
    imageUrl:
      'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rumah-tangga-shop',
    name: 'Setrika Sharp ES-T1250',
    slug: 'setrika-sharp-es-t1250',
    price: 189000,
    stock: 35,
    soldCount: 18,
    rating: '4.40',
    description:
      'Setrika listrik Sharp dengan lapisan anti lengket, pengatur suhu otomatis, dan kabel fleksibel yang aman digerakkan.',
    imageUrl:
      'https://images.unsplash.com/photo-1610557892470-76d747eed2f1?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rumah-tangga-shop',
    name: 'Organizer Plastik Susun 3',
    slug: 'organizer-plastik-susun-3',
    price: 149000,
    stock: 50,
    soldCount: 28,
    rating: '4.30',
    description:
      'Laci plastik lemari organizer serbaguna susun 3 dengan roda kecil. Sangat praktis menata perlengkapan kamar tidur atau dapur.',
    imageUrl:
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rumah-tangga-shop',
    name: 'Lampu LED 12W Hemat Energi',
    slug: 'lampu-led-12w-hemat-energi',
    price: 28000,
    stock: 200,
    soldCount: 125,
    rating: '4.60',
    description:
      'Lampu bohlam LED 12 Watt cahaya putih terang (Cool Daylight). Sangat hemat energi dibandingkan bohlam pijar konvensional.',
    imageUrl:
      'https://images.unsplash.com/photo-1550985616-10810253b84d?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rumah-tangga-shop',
    name: 'Panci Set Stainless 5pc',
    slug: 'panci-set-stainless-5pc',
    price: 249000,
    stock: 30,
    soldCount: 14,
    rating: '4.50',
    description:
      'Set panci stainless steel tebal isi 5 ukuran berbeda lengkap dengan tutup kaca transparan. Aman digunakan di kompor induksi.',
    imageUrl:
      'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rumah-tangga-shop',
    name: 'Gelas Plastik BPA Free 1L',
    slug: 'gelas-plastik-bpa-free-1l',
    price: 18000,
    stock: 300,
    soldCount: 185,
    rating: '4.40',
    description:
      'Tumbler gelas plastik premium BPA Free kapasitas 1 liter, dilengkapi tanda takaran air dan sedotan ramah lingkungan.',
    imageUrl:
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rumah-tangga-shop',
    name: 'Sapu Ijuk Anti Bacteria',
    slug: 'sapu-ijuk-anti-bacteria',
    price: 35000,
    stock: 150,
    soldCount: 92,
    rating: '4.50',
    description:
      'Sapu lantai ijuk alami berkualitas tinggi dengan gagang pipa besi kokoh. Ijuk tebal dan tidak mudah rontok saat menyapu.',
    imageUrl:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rumah-tangga-shop',
    name: 'Tempat Sampah Pedal 12L',
    slug: 'tempat-sampah-pedal-12l',
    price: 89000,
    stock: 60,
    soldCount: 35,
    rating: '4.30',
    description:
      'Tempat sampah pedal injak plastik kapasitas 12 liter dengan ember bagian dalam yang bisa dilepas pasang untuk membuang sampah.',
    imageUrl:
      'https://images.unsplash.com/photo-1591193686104-fddbaaf28b7f?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rumah-tangga-shop',
    name: 'Rak Sepatu Minimalis 5 Susun',
    slug: 'rak-sepatu-minimalis-5-susun',
    price: 179000,
    stock: 40,
    soldCount: 20,
    rating: '4.40',
    description:
      'Rak sepatu minimalis susun 5 terbuat dari paduan besi hollow dan kayu MDF tebal. Kokoh untuk menampung 15 pasang sepatu.',
    imageUrl:
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&auto=format&fit=crop&q=80',
  },

  // Rina's Multi Store (12 products)
  {
    storeSlug: 'rinas-multi-store',
    name: 'Kopi Arabica Toraja Premium',
    slug: 'kopi-arabica-toraja',
    price: 85000,
    stock: 100,
    soldCount: 65,
    rating: '4.80',
    description:
      'Biji kopi atau bubuk Kopi Arabika Toraja asli kualitas ekspor, roasting profile medium. Memiliki rasa khas rempah-rempah eksotis.',
    imageUrl:
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rinas-multi-store',
    name: 'Indomie Goreng Box 40pcs',
    slug: 'indomie-goreng-box',
    price: 48000,
    stock: 80,
    soldCount: 52,
    rating: '4.90',
    description:
      'Mie instan favorit Indonesia Indomie Goreng kemasan karton box isi 40 bungkus. Praktis dan stok hemat kebutuhan keluarga.',
    imageUrl:
      'https://images.unsplash.com/photo-1612966608997-30d52406e417?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rinas-multi-store',
    name: 'Snack Chitato Sapi Panggang',
    slug: 'snack-chitato-sapi-panggang',
    price: 12000,
    stock: 200,
    soldCount: 145,
    rating: '4.60',
    description:
      'Chitato keripik kentang rasa sapi panggang klasik ukuran besar dengan potongan bergelombang yang renyah dan bumbu gurih merata.',
    imageUrl:
      'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rinas-multi-store',
    name: 'Teh Celup Sariwangi 100袋',
    slug: 'teh-celup-sariwangi-100',
    price: 15000,
    stock: 150,
    soldCount: 98,
    rating: '4.50',
    description:
      'Teh hitam Sariwangi celup kemasan besar isi 100 kantong teh. Dibuat dari daun teh pilihan berkualitas untuk kehangatan berkumpul.',
    imageUrl:
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rinas-multi-store',
    name: 'Madu Hutan Murni 500ml',
    slug: 'madu-hutan-murni-500ml',
    price: 75000,
    stock: 60,
    soldCount: 35,
    rating: '4.70',
    description:
      'Madu murni alami hasil panen dari lebah liar hutan tropis Indonesia. Kaya nutrisi dan bebas dari bahan pemanis buatan.',
    imageUrl:
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rinas-multi-store',
    name: 'Minyak Goreng Bimoli 2L',
    slug: 'minyak-goreng-bimoli-2l',
    price: 28000,
    stock: 120,
    soldCount: 88,
    rating: '4.50',
    description:
      'Minyak goreng kelapa sawit Bimoli pouch 2 liter. Diproses dari kelapa sawit pilihan untuk menghasilkan gorengan yang renyah dan sehat.',
    imageUrl:
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rinas-multi-store',
    name: 'Gula Pasir Gulaku 1kg',
    slug: 'gula-pasir-gulaku-1kg',
    price: 14000,
    stock: 200,
    soldCount: 155,
    rating: '4.60',
    description:
      'Gula pasir kristal putih Gulaku kemasan 1 kg. Bersih, higienis, manis alami untuk campuran minuman maupun aneka kue.',
    imageUrl:
      'https://images.unsplash.com/photo-1581781862215-680c4c361c47?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rinas-multi-store',
    name: 'Beras Premium 5kg',
    slug: 'beras-premium-5kg',
    price: 65000,
    stock: 80,
    soldCount: 55,
    rating: '4.40',
    description:
      'Beras putih premium kemasan 5 kg. Menghasilkan nasi yang pulen, bersih, putih alami tanpa pemutih maupun pewangi buatan.',
    imageUrl:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rinas-multi-store',
    name: 'Air Mineral Aqua 19L',
    slug: 'air-mineral-aqua-19l',
    price: 18000,
    stock: 300,
    soldCount: 220,
    rating: '4.70',
    description:
      'Air minum mineral galon Aqua isi ulang 19 liter (harga isi saja, tidak termasuk galon kosong). Diproses steril dari mata air pegunungan.',
    imageUrl:
      'https://images.unsplash.com/photo-1548839140-29a88648f24b?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rinas-multi-store',
    name: 'Sabun Lifebuoy Botol',
    slug: 'sabun-lifebuoy-botol',
    price: 12000,
    stock: 180,
    soldCount: 125,
    rating: '4.50',
    description:
      'Sabun cair antikuman Lifebuoy botol pump 250ml. Perlindungan ekstra terhadap kuman penyebab penyakit saat mandi sekeluarga.',
    imageUrl:
      'https://images.unsplash.com/photo-1608248597481-496100c8c836?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rinas-multi-store',
    name: 'Pasta Gigi Colgate 170g',
    slug: 'pasta-gigi-colgate-170g',
    price: 18000,
    stock: 150,
    soldCount: 95,
    rating: '4.60',
    description:
      'Pasta gigi Colgate Maximum Cavity Protection 170g. Mengandung kalsium dan fluoride aktif untuk gigi kuat berenergi dingin.',
    imageUrl:
      'https://images.unsplash.com/photo-1559599189-fe84dea4eb79?w=400&auto=format&fit=crop&q=80',
  },
  {
    storeSlug: 'rinas-multi-store',
    name: 'Tisu Paseo 250sheets',
    slug: 'tisu-paseo-250sheets',
    price: 22000,
    stock: 200,
    soldCount: 142,
    rating: '4.70',
    description:
      'Paseo facial tissue 250 sheets 2-ply. Tisu wajah yang sangat lembut, kuat, higienis, dan aman untuk kulit wajah sensitif sekalipun.',
    imageUrl:
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80',
  },
];
