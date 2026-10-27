import { carts, cartItems } from '../schema';
import type { Dbs } from '../dbs';

export async function seedCarts(
  { commerce: tx }: Dbs,
  userMap: Map<string, string>,
  productMap: Map<string, string>,
  storeMap: Map<string, string>,
) {
  console.log('Seeding carts...');

  // 1. Clean up existing carts
  await tx.delete(carts);

  // Buyers list from data
  const buyers = [
    'dewi_lestari',
    'sari_dewi',
    'putri_anggraini',
    'andi_prasetyo',
    'rizki_pratama',
    'nadia_saputri',
    'agus_setiawan',
    'rina_wulandari',
    'rina_multi',
  ];

  // We define some mock active cart items for some buyers
  const cartPresets = [
    {
      buyer: 'putri_anggraini',
      storeSlug: 'maya-beauty-official',
      items: [
        { productSlug: 'serum-vitamin-c', quantity: 2 },
        { productSlug: 'sunscreen-spf50', quantity: 1 },
      ],
    },
    {
      buyer: 'dewi_lestari',
      storeSlug: 'toko-elektronik-budi',
      items: [{ productSlug: 'logitech-wireless-mouse-m331', quantity: 1 }],
    },
    {
      buyer: 'sari_dewi',
      storeSlug: 'fashion-corner-id',
      items: [{ productSlug: 'kaos-polos-combed', quantity: 3 }],
    },
    {
      buyer: 'nadia_saputri',
      storeSlug: 'gadget-hub-store',
      items: [{ productSlug: 'keyboard-logitech-k380', quantity: 1 }],
    },
  ];

  for (const buyer of buyers) {
    const buyerId = userMap.get(buyer);
    if (!buyerId) continue;

    const preset = cartPresets.find((p) => p.buyer === buyer);
    let storeId: string | null = null;

    if (preset) {
      storeId = storeMap.get(preset.storeSlug) || null;
    }

    const [insertedCart] = await tx
      .insert(carts)
      .values({
        buyerId,
        storeId,
      })
      .returning();

    if (preset && storeId) {
      for (const item of preset.items) {
        const productId = productMap.get(item.productSlug);
        if (productId) {
          await tx.insert(cartItems).values({
            cartId: insertedCart.id,
            productId,
            quantity: item.quantity,
          });
        }
      }
    }
  }

  console.log(`Seeded active carts for all buyers successfully.`);
}
