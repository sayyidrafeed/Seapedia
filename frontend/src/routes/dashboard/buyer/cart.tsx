import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBuyerCartOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { updateCartItem, deleteCartItem, clearCart } from '@/lib/api/generated';
import { CartDetails } from '@/components/cart/CartDetails';
import type { CartSummary } from '@/components/cart/CartDetails';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/buyer/cart')({
  component: BuyerCartPage,
});

function BuyerCartPage() {
  const queryClient = useQueryClient();

  // Fetch cart details
  const {
    data: cart,
    isLoading,
    error,
  } = useQuery({
    ...getBuyerCartOptions(),
  });

  // Mutation to update cart item quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const { data, error } = await updateCartItem({
        path: { id: itemId },
        body: { quantity },
      });
      if (error) {
        throw new Error(error.error || 'Failed to update quantity');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getBuyerCartOptions().queryKey });
      toast.success('Cart updated');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Mutation to remove item from cart
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { data, error } = await deleteCartItem({
        path: { id: itemId },
      });
      if (error) {
        throw new Error(error.error || 'Failed to remove item');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getBuyerCartOptions().queryKey });
      toast.success('Item removed from cart');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Mutation to clear cart
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await clearCart();
      if (error) {
        throw new Error(error.error || 'Failed to clear cart');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getBuyerCartOptions().queryKey });
      toast.success('Cart cleared');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
  };

  const handleRemoveItem = (itemId: string) => {
    removeItemMutation.mutate(itemId);
  };

  const handleClearCart = () => {
    clearCartMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl animate-pulse space-y-6">
        <div className="h-10 bg-muted rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-28 bg-muted rounded" />
            <div className="h-28 bg-muted rounded" />
          </div>
          <div className="h-60 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !cart) {
    return (
      <div className="container mx-auto px-6 py-8 text-center text-sm text-destructive">
        Error loading cart. Please try again later.
      </div>
    );
  }

  // Cast generated type to our defined CartSummary type to ensure full type-safety
  const cartSummary: CartSummary = {
    id: cart.id,
    buyerId: cart.buyerId,
    storeId: (cart.storeId as string) || null,
    storeName: (cart.storeName as string) || null,
    storeSlug: (cart.storeSlug as string) || null,
    items: (cart.items || []).map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        stock: item.product.stock,
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    subtotal: cart.subtotal,
    totalItems: cart.totalItems,
  };

  const isUpdating =
    updateQuantityMutation.isPending || removeItemMutation.isPending || clearCartMutation.isPending;

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Shopping Cart</h1>
        <p className="text-sm text-muted-foreground">
          Review your items and prepare before checkout.
        </p>
      </div>

      <CartDetails
        cart={cartSummary}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        isUpdating={isUpdating}
      />
    </div>
  );
}
