import { createInternalClient } from '@seapedia/platform/internal-client';
import { env } from '@/env';

/** Typed clients for the services commerce calls. Response schemas live with each caller. */
export const catalogClient = createInternalClient({
  service: 'catalog',
  baseUrl: env.CATALOG_SERVICE_URL,
  token: env.INTERNAL_API_TOKEN,
});

export const identityClient = createInternalClient({
  service: 'identity',
  baseUrl: env.IDENTITY_SERVICE_URL,
  token: env.INTERNAL_API_TOKEN,
});
