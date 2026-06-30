import { Link } from '@tanstack/react-router';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  description: unknown;
  price: number;
  slug: string;
  storeSlug: string;
  storeName?: string;
}

interface MarketplaceProductCardProps {
  product: Product;
  showStoreName?: boolean;
}

export function MarketplaceProductCard({
  product,
  showStoreName = true,
}: MarketplaceProductCardProps) {
  return (
    <div className="group bg-card border border-border p-5 rounded-xl shadow-surface hover:shadow-hover transition-all duration-normal flex flex-col justify-between">
      <div className="space-y-2">
        {showStoreName && product.storeName && (
          <Link
            to="/$storeSlug"
            params={{ storeSlug: product.storeSlug }}
            className="text-xs text-primary font-semibold uppercase tracking-wider hover:underline"
          >
            Store: {product.storeName}
          </Link>
        )}
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {(product.description as string) || ''}
        </p>
      </div>

      <div className="flex items-center justify-between pt-6 mt-4 border-t border-border/50">
        <span className="text-base font-extrabold text-foreground">
          {formatCurrency(product.price)}
        </span>
        <Link
          to="/$storeSlug/$productSlug"
          params={{
            storeSlug: product.storeSlug,
            productSlug: product.slug,
          }}
        >
          <Button variant="secondary" size="sm" className="text-xs cursor-pointer">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}
