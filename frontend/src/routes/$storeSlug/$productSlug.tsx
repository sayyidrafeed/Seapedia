import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProductBySlug,
  addCartItem,
  clearCart,
  getBuyerCart,
} from '@/lib/api/generated/sdk.gen';
import { getBuyerCartOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';
import { useState, Suspense, lazy } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { ProductReviews } from '@/components/products/product-reviews';
import { StoreInfoCard } from '@/features/marketplace/components/store-info-card';
import { QuantitySelector } from '@/components/shared/quantity-selector';

const CartConflictDialog = lazy(() =>
  import('@/components/cart/CartConflictDialog').then((m) => ({
    default: m.CartConflictDialog,
  })),
);

export const Route = createFileRoute('/$storeSlug/$productSlug')({
  component: StoreProductPage,
});

function StoreProductPage() {
  const { storeSlug, productSlug } = Route.useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [conflictOpen, setConflictOpen] = useState(false);
  const [currentStoreName, setCurrentStoreName] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', storeSlug, productSlug],
    queryFn: async () => {
      const res = await getProductBySlug({
        path: { storeSlug, productSlug },
        throwOnError: true,
      });
      return res.data;
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (vars: { productId: string; quantity: number }) => {
      const { data, error, response } = await addCartItem({
        body: vars,
      });

      if (response && response.status === 409) {
        // Fetch current cart to find out store name for the dialog
        const { data: cartData } = await getBuyerCart();
        throw { status: 409, currentStoreName: (cartData?.storeName as string) || 'another store' };
      }

      if (error) {
        throw new Error(error.error || 'Failed to add item to cart');
      }

      return data;
    },
    onSuccess: () => {
      toast.success(t('catalog.addedToCartSuccess'));
      queryClient.invalidateQueries({ queryKey: getBuyerCartOptions().queryKey });
    },
    onError: (err: unknown) => {
      const errorObj = err as { status?: number; currentStoreName?: string; message?: string };
      if (errorObj.status === 409) {
        setCurrentStoreName(errorObj.currentStoreName || 'another store');
        setConflictOpen(true);
      } else {
        toast.error(errorObj.message || 'An error occurred');
      }
    },
  });

  const clearAndAddMutation = useMutation({
    mutationFn: async () => {
      if (!product) return;
      const { error: clearErr } = await clearCart();
      if (clearErr) throw new Error(clearErr.error || 'Failed to clear cart');

      const { data, error: addErr } = await addCartItem({
        body: { productId: product.id, quantity },
      });
      if (addErr) throw new Error(addErr.error || 'Failed to add item to cart');

      return data;
    },
    onSuccess: () => {
      toast.success(t('catalog.clearedAndAddedSuccess'));
      queryClient.invalidateQueries({ queryKey: getBuyerCartOptions().queryKey });
      setConflictOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleAddToCart = () => {
    if (!auth.user) {
      toast.error(t('catalog.signInToAddToCart'));
      navigate({ to: '/login' });
      return;
    }

    if (auth.activeRole !== 'buyer') {
      toast.error(t('catalog.switchToBuyerRole'));
      return;
    }

    if (!product) return;

    addToCartMutation.mutate({ productId: product.id, quantity });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-5xl animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 h-80 bg-muted rounded-xl" />
          <div className="lg:col-span-5 h-80 bg-muted rounded-xl" />
          <div className="lg:col-span-3 h-80 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-6 py-12 text-center text-sm text-destructive">
        {t('catalog.storeNotFoundDesc')}
      </div>
    );
  }

  const isAdding = addToCartMutation.isPending || clearAndAddMutation.isPending;

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl space-y-10 pb-28 lg:pb-12">
      <Link
        to="/"
        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
      >
        &larr; {t('catalog.backToCatalog')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Section - Product Image */}
        <div className="lg:col-span-4">
          <div className="aspect-square bg-muted rounded-xl overflow-hidden border border-border">
            {product.imageUrl ? (
              <img
                src={product.imageUrl as string}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5">
                <span className="text-xs font-semibold">No Image</span>
              </div>
            )}
          </div>
        </div>

        {/* Center Section - Product Details & Store Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-foreground">
                  {parseFloat((product.rating as string) || '0.00').toFixed(1)}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({(product.reviewCount as number) || 0} {t('reviews.countLabel', 'ulasan')})
                </span>
              </div>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-muted-foreground text-xs">
                Terjual{' '}
                <span className="font-semibold text-foreground">
                  {(product.soldCount as number) || 0}
                </span>
              </span>
            </div>

            <div className="pt-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Harga</span>
              <p className="text-3xl font-black text-foreground mt-1">
                {formatCurrency(product.price)}
              </p>
            </div>
          </div>

          <div className="border-t border-border/50 pt-4">
            <h4 className="font-bold text-sm mb-2">Deskripsi Produk</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {(product.description as string) || 'Tidak ada deskripsi.'}
            </p>
          </div>

          {/* Store Info Card */}
          <div className="border-t border-border/50 pt-6">
            <StoreInfoCard
              storeName={product.storeName || ''}
              storeSlug={product.storeSlug || ''}
              storeLogoUrl={(product.storeLogoUrl as string) || null}
              storeRating={(product.storeRating as string) || '0.00'}
              storeReviewCount={(product.storeReviewCount as number) || 0}
              storeTotalProducts={(product.storeTotalProducts as number) || 0}
            />
          </div>
        </div>

        {/* Right Section - Desktop Checkout Card */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="border border-border rounded-xl p-5 bg-card space-y-5 sticky top-6">
            <h4 className="font-bold text-sm">Atur Jumlah</h4>

            <div className="flex items-center gap-3">
              <QuantitySelector value={quantity} max={product.stock} onChange={setQuantity} />
              <span className="text-xs text-muted-foreground">Stok: {product.stock}</span>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(product.price * quantity)}
                </span>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || isAdding}
                className="w-full cursor-pointer"
              >
                {product.stock <= 0
                  ? t('catalog.outOfStock')
                  : isAdding
                    ? t('catalog.adding')
                    : t('catalog.addToCart')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sticky Bottom Bar for Mobile Viewports */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-4 z-40 flex items-center justify-between gap-4 shadow-lg">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
            Subtotal
          </span>
          <span className="font-black text-primary text-base">
            {formatCurrency(product.price * quantity)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <QuantitySelector value={quantity} max={product.stock} onChange={setQuantity} />

          <Button
            onClick={handleAddToCart}
            disabled={product.stock <= 0 || isAdding}
            className="cursor-pointer font-bold h-9 text-xs px-3"
          >
            {product.stock <= 0 ? 'Habis' : isAdding ? 'Loading...' : '+ Keranjang'}
          </Button>
        </div>
      </div>

      <Suspense fallback={null}>
        <CartConflictDialog
          isOpen={conflictOpen}
          onClose={() => setConflictOpen(false)}
          onConfirm={() => clearAndAddMutation.mutate()}
          currentStoreName={currentStoreName}
          newStoreName={product.storeName}
        />
      </Suspense>

      <div className="border-t border-border/50 pt-8">
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}
