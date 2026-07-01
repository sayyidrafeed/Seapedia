import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(8),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().default(3001),
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
    R2_PUBLIC_DOMAIN: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export const frontendUrls: string[] = [env.FRONTEND_URL];
export type EnvType = typeof env;
