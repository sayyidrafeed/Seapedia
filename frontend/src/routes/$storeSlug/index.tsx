import { createFileRoute } from '@tanstack/react-router';
import { PublicStorePage } from '@/features/marketplace/components/public-store-page';

export const Route = createFileRoute('/$storeSlug/')({
  component: PublicStoreComponent,
});

function PublicStoreComponent() {
  const { storeSlug } = Route.useParams();
  return <PublicStorePage storeSlug={storeSlug} />;
}
