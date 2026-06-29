import { db } from '@/db';
import { carts, cartItems, products, stores } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError, ConflictError, ValidationError } from '@/lib/errors';

export class BuyersCartService {
  static async getOrCreateCart(buyerId: string) {
    let [cart] = await db.select().from(carts).where(eq(carts.buyerId, buyerId)).limit(1);

    if (!cart) {
      [cart] = await db.insert(carts).values({ buyerId, storeId: null }).returning();
    }
    return cart;
  }

  static async getCartSummary(buyerId: string) {
    const cart = await this.getOrCreateCart(buyerId);

    // Fetch items with product details
    const items = await db
      .select({
        cartItemId: cartItems.id,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        product: {
          id: products.id,
          name: products.name,
          slug: products.slug,
          price: products.price,
          stock: products.stock,
        },
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    // Fetch store details if storeId is set
    let storeName: string | null = null;
    let storeSlug: string | null = null;

    if (cart.storeId) {
      const [store] = await db.select().from(stores).where(eq(stores.id, cart.storeId)).limit(1);
      if (store) {
        storeName = store.name;
        storeSlug = store.slug;
      }
    }

    // Calculate subtotal and totalItems (on backend!)
    let subtotal = 0;
    let totalItems = 0;
    const formattedItems = items.map((item) => {
      subtotal += item.product.price * item.quantity;
      totalItems += item.quantity;
      return {
        id: item.cartItemId,
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });

    return {
      id: cart.id,
      buyerId: cart.buyerId,
      storeId: cart.storeId,
      storeName,
      storeSlug,
      items: formattedItems,
      subtotal,
      totalItems,
      createdAt: cart.createdAt.toISOString(),
      updatedAt: cart.updatedAt.toISOString(),
    };
  }

  static async addItemToCart(buyerId: string, productId: string, quantity: number) {
    // 1. Fetch product to verify existence and check store
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.stock < quantity) {
      throw new ValidationError(`Insufficient stock. Only ${product.stock} items left.`);
    }

    // 2. Get or create cart
    const cart = await this.getOrCreateCart(buyerId);

    // 3. Single-store check
    if (cart.storeId && cart.storeId !== product.storeId) {
      throw new ConflictError('Cart contains products from a different store');
    }

    // Update cart storeId if it is null
    if (!cart.storeId) {
      await db
        .update(carts)
        .set({ storeId: product.storeId, updatedAt: new Date() })
        .where(eq(carts.id, cart.id));
    }

    // 4. Upsert cart item
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)))
      .limit(1);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        throw new ValidationError(
          `Insufficient stock. Total quantity in cart would exceed stock (${product.stock}).`,
        );
      }

      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: newQuantity, updatedAt: new Date() })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      const [newItem] = await db
        .insert(cartItems)
        .values({
          cartId: cart.id,
          productId,
          quantity,
        })
        .returning();
      return newItem;
    }
  }

  static async updateCartItemQuantity(buyerId: string, cartItemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(buyerId);

    const [item] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cart.id)))
      .limit(1);

    if (!item) {
      throw new NotFoundError('Cart item not found');
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.stock < quantity) {
      throw new ValidationError(`Insufficient stock. Only ${product.stock} items left.`);
    }

    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, cartItemId))
      .returning();

    return updatedItem;
  }

  static async removeCartItem(buyerId: string, cartItemId: string) {
    const cart = await this.getOrCreateCart(buyerId);

    const [item] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cart.id)))
      .limit(1);

    if (!item) {
      throw new NotFoundError('Cart item not found');
    }

    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));

    // If cart is now empty, reset storeId to null
    const remainingItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id))
      .limit(1);

    if (remainingItems.length === 0) {
      await db
        .update(carts)
        .set({ storeId: null, updatedAt: new Date() })
        .where(eq(carts.id, cart.id));
    }

    return { success: true };
  }

  static async clearCart(buyerId: string) {
    const cart = await this.getOrCreateCart(buyerId);

    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    await db
      .update(carts)
      .set({ storeId: null, updatedAt: new Date() })
      .where(eq(carts.id, cart.id));

    return { success: true };
  }
}
