import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Trash2, Plus, Minus, ShoppingBag, Store, AlertTriangle } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CartSummary {
  id: string;
  buyerId: string;
  storeId: string | null;
  storeName: string | null;
  storeSlug: string | null;
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}

interface CartDetailsProps {
  cart: CartSummary;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  isUpdating: boolean;
}

export function CartDetails({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  isUpdating,
}: CartDetailsProps) {
  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-primary/10 p-6 text-primary mb-6 animate-bounce">
          <ShoppingBag className="h-12 w-12" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Your cart is empty</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Looks like you haven't added anything to your cart yet. Explore our marketplace and find
          something you love!
        </p>
        <Link to="/" className="mt-6">
          <Button size="sm">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items List */}
      <div className="lg:col-span-2 space-y-6">
        {/* Store Banner */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <div>
              <span className="text-xs text-muted-foreground font-semibold uppercase">
                Shopping from
              </span>
              <h3 className="text-sm font-bold text-foreground capitalize">
                {cart.storeName || 'Unknown Store'}
              </h3>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCart}
            disabled={isUpdating}
            className="text-xs text-destructive hover:text-destructive/90 hover:bg-destructive/10 cursor-pointer"
          >
            Clear Cart
          </Button>
        </div>

        {/* Info Banner about single store */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5 flex gap-2.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Single-Store checkout behavior:</strong> Since Seapedia is a multi-seller
            marketplace, you can only checkout items from one store at a time. Adding items from
            another store will require clearing your current cart.
          </p>
        </div>

        {/* Items */}
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:border-primary/20 transition-all duration-200"
            >
              <div className="space-y-1">
                <Link
                  to="/$storeSlug/$productSlug"
                  params={{
                    storeSlug: cart.storeSlug || '',
                    productSlug: item.product.slug,
                  }}
                  className="font-bold text-foreground hover:text-primary transition-colors text-base"
                >
                  {item.product.name}
                </Link>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>Price: {formatCurrency(item.product.price)}</span>
                  <span>•</span>
                  <span>Stock: {item.product.stock} left</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                <div className="flex items-center border border-border rounded-md bg-background overflow-hidden">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1 || isUpdating}
                    className="p-2 hover:bg-accent text-foreground disabled:opacity-30 cursor-pointer border-none bg-transparent"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-semibold select-none text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock || isUpdating}
                    className="p-2 hover:bg-accent text-foreground disabled:opacity-30 cursor-pointer border-none bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-bold text-foreground min-w-[80px] text-right">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    disabled={isUpdating}
                    className="text-muted-foreground hover:text-destructive p-2 rounded-md hover:bg-destructive/10 transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Summary Card */}
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-foreground">Shopping Summary</h3>
          <div className="border-t border-b border-border py-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Total Items</span>
              <span className="font-semibold text-foreground">{cart.totalItems} items</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Selected Store</span>
              <span className="font-semibold text-foreground capitalize">
                {cart.storeName || '-'}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-baseline pt-2">
            <span className="text-sm font-semibold text-muted-foreground">Subtotal</span>
            <span className="text-2xl font-black text-foreground">
              {formatCurrency(cart.subtotal)}
            </span>
          </div>
          <Link to="/dashboard/buyer/checkout">
            <Button className="w-full mt-4 cursor-pointer">Proceed to Checkout</Button>
          </Link>
          <p className="text-[10px] text-center text-muted-foreground leading-relaxed mt-2">
            Calculations are performed securely on the server. Make sure you have a default delivery
            address set.
          </p>
        </div>
      </div>
    </div>
  );
}
