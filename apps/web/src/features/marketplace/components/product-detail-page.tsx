import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getProductById } from '@/lib/api/generated/sdk.gen';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { ProductReviews } from '@/components/products/product-reviews';
import { useCartActions } from '@/features/buyer/hooks/use-cart-actions';
import { Suspense, lazy } from 'react';

const CartConflictDialog = lazy(() =>
  import('@/components/cart/CartConflictDialog').then((m) => ({
    default: m.CartConflictDialog,
  })),
);

interface ProductDetailPageProps {
  productId: string;
}

export function ProductDetailPage({ productId }: ProductDetailPageProps) {
  const { t } = useTranslation();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const res = await getProductById({
        path: { id: productId },
        throwOnError: true,
      });
      return res.data;
    },
  });

  const {
    conflictOpen,
    setConflictOpen,
    currentStoreName,
    handleAddToCart,
    isAdding,
    clearAndAddMutation,
  } = useCartActions(product?.id);

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
            <span className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 capitalize">
              {t('catalog.storeLabel', { name: product.storeName })}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('catalog.stockLeft', { count: product.stock })}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{product.name}</h1>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed border-t border-b border-border/50 py-6">
          {(product.description as string) || ''}
        </p>

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
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || isAdding}
              className="w-full sm:w-auto rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {product.stock <= 0
                ? t('catalog.outOfStock')
                : isAdding
                  ? t('catalog.adding')
                  : t('catalog.addToCart')}
            </button>
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
