import { createEnv } from '@t3-oss/env-core';
import { runtimeEnvSchema } from '@seapedia/platform/runtime';
import { z } from 'zod';

// Secrets and bootstrap addresses only; tunables live in Consul (see config.ts).
export const env = createEnv({
  server: {
    ...runtimeEnvSchema.shape,
    PORT: z.coerce.number().int().default(4003),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
