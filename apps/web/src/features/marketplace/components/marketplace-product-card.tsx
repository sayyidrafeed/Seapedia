import { Link } from '@tanstack/react-router';
import { formatCurrency } from '@/lib/utils';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const ratingVal = parseFloat((product.rating as string) || '0.00');

  // Format sold count nicely (e.g., "100+ terjual" or "2rb+ terjual" or similar)
  const formatSoldCount = (count: number) => {
    if (count >= 1000) {
      const suffix = t('catalog.thousandSuffix', 'rb');
      return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}${suffix}+`;
    }
    if (count >= 100) {
      return `${Math.floor(count / 100) * 100}+`;
    }
    return count.toString();
  };

  return (
    <Link
      to="/$storeSlug/$productSlug"
      params={{
        storeSlug: product.storeSlug,
        productSlug: product.slug,
      }}
      className="group bg-card border border-border rounded-lg overflow-hidden flex flex-col hover:shadow-md hover:border-primary/30 transition-all duration-200"
    >
      {/* Product Image Section */}
      <div className="aspect-square w-full bg-muted relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl as string}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5">
            <span className="text-[10px] font-semibold text-muted-foreground/60">No Image</span>
          </div>
        )}
      </div>

      {/* Information Section */}
      <div className="p-2 flex-1 flex flex-col justify-between space-y-1.5">
        <div className="space-y-1">
          {showStoreName && product.storeName && (
            <span className="text-[9px] text-muted-foreground font-semibold block truncate">
              {product.storeName}
            </span>
          )}

          <h3 className="text-xs font-medium text-foreground leading-tight line-clamp-2 min-h-[2.25rem] group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Pricing Row */}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground leading-none">
              {formatCurrency(product.price)}
            </span>
          </div>
        </div>

        {/* Rating and Sold Count */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
          <div className="flex items-center gap-0.5 text-yellow-500">
            <Star className="h-3 w-3 fill-current" />
            <span className="font-semibold text-foreground">
              {ratingVal > 0 ? ratingVal.toFixed(1) : '-'}
            </span>
          </div>
          {product.soldCount !== undefined && (product.soldCount as number) > 0 && (
            <>
              <span>•</span>
              <span>
                {formatSoldCount(product.soldCount as number)} {t('catalog.sold', 'terjual')}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
