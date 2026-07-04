import { createFileRoute } from '@tanstack/react-router';
import { StoreProductPage } from '@/features/marketplace/components/store-product-page';

export const Route = createFileRoute('/$storeSlug/$productSlug')({
  component: StoreProductComponent,
});

function StoreProductComponent() {
  const { storeSlug, productSlug } = Route.useParams();
  return <StoreProductPage storeSlug={storeSlug} productSlug={productSlug} />;
}
