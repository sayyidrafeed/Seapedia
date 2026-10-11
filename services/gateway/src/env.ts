import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    INTERNAL_API_TOKEN: z.string().min(16),
    IDENTITY_SERVICE_URL: z.string().url(),
    CATALOG_SERVICE_URL: z.string().url(),
    COMMERCE_SERVICE_URL: z.string().url(),
    /** Comma-separated browser origins allowed by CORS (with credentials). */
    FRONTEND_URL: z
      .string()
      .default('http://localhost:5173')
      .transform((v) =>
        v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    /** Public base URL of this gateway, advertised in the OpenAPI document. */
    PUBLIC_API_URL: z.string().url().default('http://localhost:3001'),
    UPSTREAM_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    SESSION_CACHE_TTL_MS: z.coerce.number().int().min(0).default(5_000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().default(3001),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
