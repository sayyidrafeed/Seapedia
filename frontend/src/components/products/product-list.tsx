import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';

export interface ProductItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
}

interface ProductListProps {
  products: ProductItem[];
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function ProductList({ products, onDelete, isDeleting }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl">
        <p className="text-muted-foreground text-sm">No products found. Start by adding one!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-card border border-border rounded-xl shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="p-4 font-medium text-muted-foreground">Product</th>
            <th className="p-4 font-medium text-muted-foreground">Price</th>
            <th className="p-4 font-medium text-muted-foreground">Stock</th>
            <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-muted/20 transition-colors">
              <td className="p-4">
                <div className="font-semibold text-foreground">{product.name}</div>
                {product.description ? (
                  <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {product.description}
                  </div>
                ) : null}
              </td>
              <td className="p-4 font-medium text-foreground">
                Rp {product.price.toLocaleString('id-ID')}
              </td>
              <td className="p-4">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    product.stock > 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {product.stock} available
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                <Link
                  to="/dashboard/seller/products/$productId/edit"
                  params={{ productId: product.id }}
                  className={isDeleting ? 'pointer-events-none' : undefined}
                >
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={isDeleting}>
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => onDelete(product.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
