import { createInternalClient } from '@seapedia/platform/internal-client';
import { z } from 'zod';
import { productDocumentSchema } from '@/elastic/documents';
import { env } from '@/env';

export const catalogClient = createInternalClient({
  service: 'catalog',
  baseUrl: env.CATALOG_SERVICE_URL,
  token: env.INTERNAL_API_TOKEN,
  timeoutMs: 10_000,
});

const documentsSchema = z.object({ documents: z.array(productDocumentSchema) });
const exportPageSchema = documentsSchema.extend({ next: z.string().nullable() });

export async function fetchDocuments(productIds: string[], storeIds: string[]) {
  const { documents } = await catalogClient.get('/internal/search/documents', documentsSchema, {
    productIds: productIds.length > 0 ? productIds : undefined,
    storeIds: storeIds.length > 0 ? storeIds : undefined,
  });
  return documents;
}

export async function fetchExportPage(after: string | undefined, limit: number) {
  return await catalogClient.get('/internal/search/documents/export', exportPageSchema, {
    after,
    limit,
  });
}
