import { Link } from '@tanstack/react-router';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: unknown;
  price: number;
  slug: string;
  storeSlug: string;
  storeName?: string;
  imageUrl?: unknown;
  rating?: unknown;
  reviewCount?: unknown;
  soldCount?: unknown;
}

interface MarketplaceProductCardProps {
  product: Product;
  showStoreName?: boolean;
}

export function MarketplaceProductCard({
  product,
  showStoreName = true,
}: MarketplaceProductCardProps) {
  const ratingVal = parseFloat((product.rating as string) || '0.00');

  return (
    <div className="group bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image Section */}
      <div className="aspect-square w-full bg-muted relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl as string}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5">
            <span className="text-xs font-semibold">No Image</span>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          {showStoreName && product.storeName && (
            <Link
              to="/$storeSlug"
              params={{ storeSlug: product.storeSlug }}
              className="text-[10px] text-primary font-bold uppercase tracking-wider hover:underline"
            >
              {product.storeName}
            </Link>
          )}
          <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            <Link
              to="/$storeSlug/$productSlug"
              params={{
                storeSlug: product.storeSlug,
                productSlug: product.slug,
              }}
            >
              {product.name}
            </Link>
          </h3>

          {/* Rating and Sold Count */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center text-yellow-400">
              <Star className="h-3 w-3 fill-current" />
              <span className="font-semibold ml-0.5 text-foreground">
                {ratingVal > 0 ? ratingVal.toFixed(1) : '-'}
              </span>
            </div>
            {product.reviewCount !== undefined && (product.reviewCount as number) > 0 && (
              <span className="text-muted-foreground text-[10px]">
                ({product.reviewCount as number})
              </span>
            )}
            {product.soldCount !== undefined && (product.soldCount as number) > 0 && (
              <>
                <span className="text-muted-foreground text-[10px]">•</span>
                <span className="text-muted-foreground text-[10px]">
                  Terjual {product.soldCount as number}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="text-sm font-black text-foreground">
            {formatCurrency(product.price)}
          </span>
          <Link
            to="/$storeSlug/$productSlug"
            params={{
              storeSlug: product.storeSlug,
              productSlug: product.slug,
            }}
          >
            <Button size="sm" className="text-xs cursor-pointer px-3 py-1 h-8">
              Detail
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
