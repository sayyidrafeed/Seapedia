import { createFileRoute, Link } from '@tanstack/react-router';
import { useSellerProducts } from '@/features/seller/hooks/use-seller-products';
import { ProductList } from '@/components/products/product-list';
import type { ProductItem } from '@/components/products/product-list';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/seller/products/')({
  component: SellerProductsPage,
});

function SellerProductsPage() {
  const { t } = useTranslation();
  const { products, totalPages, page, isLoading, isDeleting, setPage, deleteProduct } =
    useSellerProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('seller.products.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('seller.products.desc')}</p>
        </div>
        <Link to="/dashboard/seller/products/create">
          <Button className="w-full sm:w-auto inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('seller.products.addButton')}
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <span className="animate-pulse text-muted-foreground text-sm font-medium">
            {t('seller.products.loading')}
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          <ProductList
            products={(products as ProductItem[]) ?? []}
            onDelete={deleteProduct}
            isDeleting={isDeleting}
          />

          {/* Pagination Controls */}
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
