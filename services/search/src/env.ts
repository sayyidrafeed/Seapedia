import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    INTERNAL_API_TOKEN: z.string().min(16),
    CATALOG_SERVICE_URL: z.string().url(),
    ELASTICSEARCH_URL: z.string().url(),
    ELASTICSEARCH_USERNAME: z.string().default('elastic'),
    ELASTICSEARCH_PASSWORD: z.string().min(1),
    /** Alias the service reads and writes; concrete indices are `<alias>_<timestamp>`. */
    INDEX_ALIAS: z.string().default('products'),
    OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().default(4004),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
