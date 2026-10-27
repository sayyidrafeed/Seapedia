import { createEnv } from '@t3-oss/env-core';
import { runtimeEnvSchema } from '@seapedia/platform/runtime';
import { z } from 'zod';

// Secrets and bootstrap addresses only; tunables live in Consul (see config.ts).
export const env = createEnv({
  server: {
    ...runtimeEnvSchema.shape,
    PORT: z.coerce.number().int().default(4001),
    DATABASE_URL: z.string().url(),
    // RS256 private key (PKCS#8 PEM) that signs access and service tokens.
    JWT_PRIVATE_KEY: z.string().min(1),
    // Client-credentials secrets of the other services: `catalog=...,commerce=...`.
    SERVICE_CLIENT_SECRETS: z.string().transform(
      (v) =>
        Object.fromEntries(
          v
            .split(',')
            .map((pair) => pair.trim().split('='))
            .filter(([k, s]) => k && s),
        ) as Record<string, string>,
    ),
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
