import { createFileRoute } from '@tanstack/react-router';
import { useProductCatalog } from '@/features/marketplace/hooks/use-product-catalog';
import { MarketplaceHero } from '@/features/marketplace/components/marketplace-hero';
import { MarketplaceProductCard } from '@/features/marketplace/components/marketplace-product-card';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { ApplicationReviewForm } from '@/components/public/application-review-form';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();
  const { search, page, productsData, isLoading, error, totalPages, setSearch, setPage } =
    useProductCatalog();

  return (
    <div className="space-y-16 pt-12 pb-0 flex-1 flex flex-col justify-between">
      {/* Hero / Header Section */}
      <section className="container mx-auto px-6 max-w-5xl space-y-8">
        <MarketplaceHero search={search} onSearchChange={setSearch} />

        {/* Product Catalog Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 md:gap-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="border border-border p-3 rounded-lg space-y-3 animate-pulse bg-card flex flex-col"
              >
                <div className="aspect-square bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-sm text-destructive">{t('landing.error')}</div>
        ) : productsData?.products.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4">
            <img
              src="/shipping-box-so.png"
              alt="No products"
              className="w-full max-w-[280px] sm:max-w-[320px] mb-6 object-contain opacity-90 hover:opacity-100 transition-opacity"
            />
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              {t('landing.noProducts')}
            </h3>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 md:gap-4">
              {productsData?.products.map((product) => (
                <MarketplaceProductCard key={product.id} product={product} showStoreName={true} />
              ))}
            </div>

            {/* Pagination Controls */}
            <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </section>

      {/* Reviews Section */}
      <section className="bg-card border-t border-border py-16 mt-auto">
        <div className="container mx-auto px-6 max-w-xl text-center space-y-6">
          <h2 className="text-2xl font-bold text-foreground">{t('landing.feedbackTitle')}</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t('landing.feedbackSubtitle')}
          </p>
          <Drawer>
            <DrawerTrigger asChild>
              <Button size="lg" className="font-semibold cursor-pointer">
                {t('landing.writeReviewButton')}
              </Button>
            </DrawerTrigger>
            <DrawerContent className="w-full p-6 pb-8">
              <div className="max-w-xl mx-auto w-full">
                <DrawerHeader className="px-0 pt-0 text-left">
                  <DrawerTitle className="text-xl font-bold">{t('review.title')}</DrawerTitle>
                  <DrawerDescription>{t('review.description')}</DrawerDescription>
                </DrawerHeader>
                <div className="mt-4">
                  <ApplicationReviewForm flat />
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </section>
    </div>
  );
}
