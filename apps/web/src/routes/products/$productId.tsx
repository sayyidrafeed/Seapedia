import { createFileRoute } from '@tanstack/react-router';
import { ProductDetailPage } from '@/features/marketplace/components/product-detail-page';

export const Route = createFileRoute('/products/$productId')({
  component: ProductDetailComponent,
});

function ProductDetailComponent() {
  const { productId } = Route.useParams();
  return <ProductDetailPage productId={productId} />;
}
