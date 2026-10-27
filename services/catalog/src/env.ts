import { createEnv } from '@t3-oss/env-core';
import { runtimeEnvSchema } from '@seapedia/platform/runtime';
import { z } from 'zod';

// Secrets and bootstrap addresses only; tunables live in Consul (see config.ts).
export const env = createEnv({
  server: {
    ...runtimeEnvSchema.shape,
    PORT: z.coerce.number().int().default(4002),
    MONGODB_URL: z.string().startsWith('mongodb'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
    R2_PUBLIC_DOMAIN: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
