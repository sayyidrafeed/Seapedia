import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    INTERNAL_API_TOKEN: z.string().min(16),
    IDENTITY_SERVICE_URL: z.string().url(),
    COMMERCE_SERVICE_URL: z.string().url(),
    // Optional: without it, product search uses the database (ILIKE) path.
    SEARCH_SERVICE_URL: z.string().url().optional(),
    SEARCH_TIMEOUT_MS: z.coerce.number().int().positive().default(500),
    OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().default(4002),
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
    R2_PUBLIC_DOMAIN: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
