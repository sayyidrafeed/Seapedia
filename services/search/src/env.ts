import { createEnv } from '@t3-oss/env-core';
import { runtimeEnvSchema } from '@seapedia/platform/runtime';
import { z } from 'zod';

/** Secrets and bootstrap addresses only; tunables live in Consul (see config.ts). */
export const env = createEnv({
  server: {
    ...runtimeEnvSchema.shape,
    PORT: z.coerce.number().int().default(4004),
    ELASTICSEARCH_URL: z.string().url(),
    ELASTICSEARCH_USERNAME: z.string().default('elastic'),
    ELASTICSEARCH_PASSWORD: z.string().min(1),
    /** Alias the service reads and writes; concrete indices are `<alias>_<timestamp>`. */
    INDEX_ALIAS: z.string().default('products'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
