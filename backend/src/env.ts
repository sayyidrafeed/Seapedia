import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(8),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().default(3001),
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export const frontendUrls: string[] = [env.FRONTEND_URL];
export type EnvType = typeof env;
