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
        body: { productId: product.id, quantity: 1 },
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

    addToCartMutation.mutate({ productId: product.id, quantity: 1 });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-3xl animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-24 bg-muted rounded w-full" />
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
    <div className="container mx-auto px-6 py-12 max-w-3xl space-y-8">
      <Link
        to="/"
        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
      >
        &larr; {t('catalog.backToCatalog')}
      </Link>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/$storeSlug"
              params={{ storeSlug: product.storeSlug }}
              className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 capitalize hover:bg-primary/20"
            >
              {t('catalog.storeLabel', { name: product.storeName })}
            </Link>
            <span className="text-xs text-muted-foreground">
              {t('catalog.stockLeft', { count: product.stock })}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{product.name}</h1>
          {Number(product.reviewCount) > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(Number(product.rating))
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-foreground">
                {Number(product.rating).toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount} {t('reviews.countLabel', 'ulasan')})
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed border-t border-b border-border/50 py-6">
          {(product.description as string) || ''}
        </p>

        {/* Store Information Card */}
        <div className="bg-muted/40 border border-border p-4 rounded-lg flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-foreground">
              {t('catalog.sellsBy', { name: product.storeName })}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">{t('catalog.visitStoreDesc')}</p>
          </div>
          <Link
            to="/$storeSlug"
            params={{ storeSlug: product.storeSlug }}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            {t('catalog.visitStore')}
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              {t('catalog.price')}
            </span>
            <p className="text-3xl font-black text-foreground mt-1">
              {formatCurrency(product.price)}
            </p>
          </div>

          <div>
            <Button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || isAdding}
              className="w-full sm:w-auto cursor-pointer"
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

      <Suspense fallback={null}>
        <CartConflictDialog
          isOpen={conflictOpen}
          onClose={() => setConflictOpen(false)}
          onConfirm={() => clearAndAddMutation.mutate()}
          currentStoreName={currentStoreName}
          newStoreName={product.storeName}
        />
      </Suspense>

      <ProductReviews productId={product.id} />
    </div>
  );
}
