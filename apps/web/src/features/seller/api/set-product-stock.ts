import { setSellerProductStock } from '@/lib/api/generated';

/**
 * Stock lives in the commerce service, which learns about a new product from catalog's event a
 * moment after it is created. Until then commerce answers 409; retry briefly.
 */
export async function setProductStock(productId: string, stock: number) {
  for (let attempt = 1; ; attempt++) {
    const result = await setSellerProductStock({ path: { productId }, body: { stock } });
    if (result.response?.status !== 409 || attempt >= 8) return result;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
