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

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { search, page, productsData, isLoading, error, totalPages, setSearch, setPage } =
    useProductCatalog();

  return (
    <div className="space-y-16 pt-12 pb-0 flex-1 flex flex-col justify-between">
      {/* Hero / Header Section */}
      <section className="container mx-auto px-6 max-w-5xl space-y-8">
        <MarketplaceHero search={search} onSearchChange={setSearch} />

        {/* Product Catalog Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="border border-border p-5 rounded-lg space-y-3 animate-pulse bg-card"
              >
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-6 bg-muted rounded w-1/3 pt-3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-sm text-destructive">
            Error loading products. Make sure the backend is running.
          </div>
        ) : productsData?.products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No products found matching your search.
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
          <h2 className="text-2xl font-bold text-foreground">Tell us what you think!</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Your feedback helps us make Seapedia better for everyone. Share your experience and
            rating with us.
          </p>
          <Drawer>
            <DrawerTrigger asChild>
              <Button size="lg" className="font-semibold cursor-pointer">
                Write a Review
              </Button>
            </DrawerTrigger>
            <DrawerContent className="w-full p-6 pb-8">
              <div className="max-w-xl mx-auto w-full">
                <DrawerHeader className="px-0 pt-0 text-left">
                  <DrawerTitle className="text-xl font-bold">Leave a Review</DrawerTitle>
                  <DrawerDescription>
                    Tell us about your experience using the Seapedia application.
                  </DrawerDescription>
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
