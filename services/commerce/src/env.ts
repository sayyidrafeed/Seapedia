import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    INTERNAL_API_TOKEN: z.string().min(16),
    IDENTITY_SERVICE_URL: z.string().url(),
    CATALOG_SERVICE_URL: z.string().url(),
    OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().default(4003),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
