import { Link } from '@tanstack/react-router';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface Cart {
  totalItems: number;
  subtotal: number;
  storeName?: string | unknown;
}

interface BuyerCartCardProps {
  cart: Cart | undefined;
  isLoading: boolean;
}

export function BuyerCartCard({ cart, isLoading }: BuyerCartCardProps) {
  const { t } = useTranslation();
  const cartItemCount = cart?.totalItems || 0;

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between group hover:border-emerald-500/20 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('buyer.cart.activeTitle')}
          </span>
          <div className="text-3xl font-extrabold text-foreground tracking-tight mt-1">
            {isLoading ? (
              <span className="h-8 w-24 bg-muted animate-pulse block rounded" />
            ) : (
              t('buyer.cart.itemsCount', { count: cartItemCount })
            )}
          </div>
          {cart && !!cart.storeName && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('buyer.cart.shoppingFrom')}{' '}
              <strong className="text-foreground capitalize">{cart.storeName as string}</strong>
            </p>
          )}
        </div>
        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
          <ShoppingCart className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-8 border-t border-border/50 pt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {cart && cart.subtotal
            ? `Subtotal: ${formatCurrency(cart.subtotal)}`
            : t('buyer.cart.empty')}
        </span>
        <Link
          to="/dashboard/buyer/cart"
          className="text-sm font-semibold text-emerald-500 hover:text-emerald-600 flex items-center gap-1 group-hover:gap-2 transition-all"
        >
          {t('buyer.cart.viewCart')} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
