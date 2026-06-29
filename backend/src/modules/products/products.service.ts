import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { StoreService } from '@/modules/stores/stores.service';

export class ProductsService {
  static async createSellerProduct(
    sellerId: string,
    input: { name: string; description?: string | null; price: number; stock: number },
  ) {
    // A Seller may only create products under their own store.
    const store = await StoreService.getBySellerId(sellerId);
    if (!store) {
      throw new ForbiddenError('You must have a store to create products');
    }

    if (input.price < 0) {
      throw new ValidationError('Price cannot be negative');
    }
    if (input.stock < 0) {
      throw new ValidationError('Stock cannot be negative');
    }

    const [product] = await db
      .insert(products)
      .values({
        storeId: store.id,
        name: input.name,
        description: input.description,
        price: input.price,
        stock: input.stock,
      })
      .returning();

    return product;
  }

  static async getSellerProducts(sellerId: string) {
    const store = await StoreService.getBySellerId(sellerId);
    if (!store) {
      return [];
    }

    const results = await db.query.products.findMany({
      where: eq(products.storeId, store.id),
    });

    return results;
  }

  static async updateSellerProduct(
    sellerId: string,
    productId: string,
    input: { name?: string; description?: string | null; price?: number; stock?: number },
  ) {
    const store = await StoreService.getBySellerId(sellerId);
    if (!store) {
      throw new ForbiddenError('You must have a store to manage products');
    }

    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.storeId, store.id)),
    });

    if (!product) {
      throw new NotFoundError('Product not found or does not belong to your store');
    }

    if (input.price !== undefined && input.price < 0) {
      throw new ValidationError('Price cannot be negative');
    }
    if (input.stock !== undefined && input.stock < 0) {
      throw new ValidationError('Stock cannot be negative');
    }

    const [updatedProduct] = await db
      .update(products)
      .set({
        name: input.name ?? product.name,
        description: input.description !== undefined ? input.description : product.description,
        price: input.price ?? product.price,
        stock: input.stock ?? product.stock,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    return updatedProduct;
  }

  static async deleteSellerProduct(sellerId: string, productId: string) {
    const store = await StoreService.getBySellerId(sellerId);
    if (!store) {
      throw new ForbiddenError('You must have a store to manage products');
    }

    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.storeId, store.id)),
    });

    if (!product) {
      throw new NotFoundError('Product not found or does not belong to your store');
    }

    await db.delete(products).where(eq(products.id, productId));
    return { success: true };
  }
}
