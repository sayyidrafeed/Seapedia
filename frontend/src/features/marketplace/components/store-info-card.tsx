import { Link } from '@tanstack/react-router';
import { Star, Package } from 'lucide-react';

interface StoreInfoCardProps {
  storeName: string;
  storeSlug: string;
  storeLogoUrl?: string | null;
  storeRating: string;
  storeReviewCount: number;
  storeTotalProducts: number;
}

export function StoreInfoCard({
  storeName,
  storeSlug,
  storeLogoUrl,
  storeRating,
  storeReviewCount,
  storeTotalProducts,
}: StoreInfoCardProps) {
  return (
    <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {storeLogoUrl ? (
          <img
            src={storeLogoUrl}
            alt={storeName}
            className="w-14 h-14 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-xl font-bold text-primary border border-border">
            {storeName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="space-y-1">
          <h4 className="font-bold text-foreground hover:text-primary transition-colors">
            <Link to="/$storeSlug" params={{ storeSlug }}>
              {storeName}
            </Link>
          </h4>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-foreground">
                {parseFloat(storeRating).toFixed(1)}
              </span>
              <span>({storeReviewCount} ulasan)</span>
            </div>
            <span className="text-muted-foreground/30">•</span>
            <div className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold text-foreground">{storeTotalProducts}</span>
              <span>Produk</span>
            </div>
          </div>
        </div>
      </div>
      <Link
        to="/$storeSlug"
        params={{ storeSlug }}
        className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
      >
        Kunjungi Toko
      </Link>
    </div>
  );
}
