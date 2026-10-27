import { createFileRoute } from '@tanstack/react-router';
import { PublicStorePage } from '@/features/marketplace/components/public-store-page';
import { z } from 'zod';

const storeSearchSchema = z.object({
  page: z.number().optional().catch(1),
});

export const Route = createFileRoute('/$storeSlug/')({
  validateSearch: storeSearchSchema,
  component: PublicStoreComponent,
});

function PublicStoreComponent() {
  const { storeSlug } = Route.useParams();
  return <PublicStorePage storeSlug={storeSlug} />;
}
