/* eslint-disable max-lines */
import { eq, avg, count } from 'drizzle-orm';
import { productReviews, appReview, products, stores, orders, orderItems } from '../schema';
import type { Dbs } from '../dbs';

const positiveComments = [
  'Barang original, pengiriman cepat! Packing juga aman. Recommended seller!',
  'Bahan premium, pas di badan dan nyaman digunakan. Pengiriman cepat.',
  'Mantap sesuai pesanan. Respon seller ramah dan cepat tanggap.',
  'Sangat puas belanja di sini. Kualitas produk jempolan.',
  'Produk bekerja dengan sangat baik, original dan segel masih utuh.',
  'Langganan di toko ini selalu memuaskan. Terima kasih seller.',
  'Harga murah tapi barang tidak murahan. Recommended banget!',
  'Bagus sekali produknya, sesuai deskripsi dan gambar.',
  'Pengemasan sangat rapi dengan bubble wrap tebal. Aman sampai tujuan.',
  'Sesuai dengan ekspektasi. Kualitas top markotop.',
];

const neutralComments = [
  'Bahannya adem, tapi agak kebesaran. Overall oke sih.',
  'Kualitas standar sesuai harga, pengiriman agak lambat sedikit.',
  'Barang berfungsi dengan baik, cuma warna agak berbeda dari foto.',
  'Respon seller agak lambat tapi produk dikirim tepat waktu.',
  'Packaging agak penyok tapi untung isinya aman. Kualitas produk lumayan.',
];

const negativeComments = [
  'Sangat mengecewakan, ukuran tidak sesuai dan respon seller lambat sekali.',
  'Barang cepat rusak padahal baru dipakai 2 hari. Tidak rekomendasi.',
  'Pengiriman lama sekali, barang yang datang salah warna.',
];

const appReviewsData = [
  {
    reviewerName: 'Dewi Lestari',
    rating: 5,
    comment: 'Seapedia sangat membantu untuk belanja online. Pengiriman cepat dan harga bersaing!',
  },
  {
    reviewerName: 'Andi Prasetyo',
    rating: 5,
    comment:
      'UI aplikasi sangat bersih, transaksi menggunakan dompet wallet instan sangat praktis!',
  },
  {
    reviewerName: 'Sari Dewi',
    rating: 4,
    comment: 'Pilihan produk lengkap sekali, terutama fashion lokalnya.',
  },
  {
    reviewerName: 'Putri Anggraini',
    rating: 5,
    comment: 'Suka sekali belanja kosmetik di sini, originalitas terjamin.',
  },
  {
    reviewerName: 'Rizki Pratama',
    rating: 4,
    comment: 'Aplikasi cepat dan responsif. Semoga driver-nya makin banyak.',
  },
  {
    reviewerName: 'Nadia Saputri',
    rating: 5,
    comment: 'Luar biasa mudah digunakan, promo hematnya banyak!',
  },
  {
    reviewerName: 'Agus Setiawan',
    rating: 4,
    comment: 'Sangat praktis untuk belanja kebutuhan pokok harian.',
  },
  {
    reviewerName: 'Rina Wulandari',
    rating: 5,
    comment: 'Pengalaman belanja yang menyenangkan. CS juga sangat solutif.',
  },
  {
    reviewerName: 'Budi Santoso',
    rating: 5,
    comment: 'Sebagai penjual, dashboard-nya sangat mudah dipahami.',
  },
  {
    reviewerName: 'Fajar Nugroho',
    rating: 5,
    comment: 'Sangat memudahkan UMKM memasarkan produk elektronik rumah tangga.',
  },
  {
    reviewerName: 'Joko Widodo',
    rating: 5,
    comment: 'Aplikasi driver-nya enteng dan alokasi orderan transparan.',
  },
  {
    reviewerName: 'Budi Hartono',
    rating: 4,
    comment: 'Bagus untuk nambah penghasilan sampingan sebagai driver.',
  },
  {
    reviewerName: 'Agus Wijaya',
    rating: 4,
    comment: 'Navigasi rute pengantaran driver cukup akurat.',
  },
  {
    reviewerName: 'Rina Multirole',
    rating: 5,
    comment: 'Multifungsi, bisa beli, jual, sekaligus narik ojek delivery!',
  },
  {
    reviewerName: 'Maya Kusuma',
    rating: 5,
    comment: 'Sangat rekomen bagi pecinta produk kecantikan lokal.',
  },
];

export async function seedReviews(
  { catalog: tx, commerce }: Dbs,
  displayNames: Map<string, string>,
  _productMap: Map<string, string>,
  _orderMap: Map<string, string>,
) {
  console.log('Seeding product reviews and app reviews...');

  // 1. Clean up existing reviews
  await tx.delete(productReviews);
  await tx.delete(appReview);

  // 2. Fetch completed orders
  const completedOrders = await commerce
    .select()
    .from(orders)
    .where(eq(orders.status, 'pesanan_selesai'));

  const reviewedProducts = new Set<string>();

  for (const order of completedOrders) {
    const items = await commerce.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    for (const item of items) {
      if (!item.productId) continue;

      // Unique constraint: 1 review per buyer per product
      const uniqKey = `${order.buyerId}_${item.productId}`;
      if (reviewedProducts.has(uniqKey)) continue;

      // 75% chance to review
      if (Math.random() > 0.75) continue;

      reviewedProducts.add(uniqKey);

      // Generate rating distribution (mostly 4-5)
      const r = Math.random();
      let rating = 5;
      let comment = positiveComments[Math.floor(Math.random() * positiveComments.length)];

      if (r < 0.1) {
        rating = Math.floor(Math.random() * 2) + 1; // 1 or 2 stars
        comment = negativeComments[Math.floor(Math.random() * negativeComments.length)];
      } else if (r < 0.25) {
        rating = 3;
        comment = neutralComments[Math.floor(Math.random() * neutralComments.length)];
      } else if (r < 0.6) {
        rating = 4;
        comment = positiveComments[Math.floor(Math.random() * positiveComments.length)];
      }

      const createdAt = new Date(order.createdAt);
      createdAt.setDate(createdAt.getDate() + 2); // Reviewed 2 days after order

      await tx.insert(productReviews).values({
        productId: item.productId,
        buyerId: order.buyerId,
        reviewerName: displayNames.get(order.buyerId) ?? 'Pembeli',
        rating,
        comment,
        createdAt,
      });
    }
  }

  // 3. Update products rating and reviewCount
  const productReviewsSummary = await tx
    .select({
      productId: productReviews.productId,
      avgRating: avg(productReviews.rating),
      totalReviews: count(productReviews.id),
    })
    .from(productReviews)
    .groupBy(productReviews.productId);

  for (const summary of productReviewsSummary) {
    if (!summary.productId) continue;
    const avgVal = parseFloat(summary.avgRating || '0.00').toFixed(2);
    const countVal = summary.totalReviews || 0;

    await tx
      .update(products)
      .set({
        rating: avgVal,
        reviewCount: countVal,
      })
      .where(eq(products.id, summary.productId));
  }

  // 4. Update stores rating and reviewCount
  const storeReviewsSummary = await tx
    .select({
      storeId: products.storeId,
      avgRating: avg(productReviews.rating),
      totalReviews: count(productReviews.id),
    })
    .from(productReviews)
    .innerJoin(products, eq(productReviews.productId, products.id))
    .groupBy(products.storeId);

  for (const summary of storeReviewsSummary) {
    if (!summary.storeId) continue;
    const avgVal = parseFloat(summary.avgRating || '0.00').toFixed(2);
    const countVal = summary.totalReviews || 0;

    await tx
      .update(stores)
      .set({
        rating: avgVal,
        reviewCount: countVal,
      })
      .where(eq(stores.id, summary.storeId));
  }

  // 5. Seed App Reviews
  for (const rawReview of appReviewsData) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 20));

    await tx.insert(appReview).values({
      reviewerName: rawReview.reviewerName,
      rating: rawReview.rating,
      comment: rawReview.comment,
      createdAt,
    });
  }

  console.log(`Seeded product reviews and ${appReviewsData.length} app reviews successfully.`);
}
