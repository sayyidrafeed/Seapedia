import { createInternalClient } from '@seapedia/platform/internal-client';
import { env } from '@/env';

/** Typed clients for the services catalog calls. Response schemas live with each caller. */
export const commerceClient = createInternalClient({
  service: 'commerce',
  baseUrl: env.COMMERCE_SERVICE_URL,
  token: env.INTERNAL_API_TOKEN,
});

export const identityClient = createInternalClient({
  service: 'identity',
  baseUrl: env.IDENTITY_SERVICE_URL,
  token: env.INTERNAL_API_TOKEN,
});

export const searchClient = env.SEARCH_SERVICE_URL
  ? createInternalClient({
      service: 'search',
      baseUrl: env.SEARCH_SERVICE_URL,
      token: env.INTERNAL_API_TOKEN,
      timeoutMs: env.SEARCH_TIMEOUT_MS,
    })
  : null;
