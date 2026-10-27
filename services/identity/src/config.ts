import { loadConfig, sharedConfigSchema, staticConfig } from '@seapedia/platform/consul';
import { z } from 'zod';
import { env } from './env';

// Non-secret tunables from Consul KV (`config/shared/*`, `config/identity/*`).
export const configSchema = sharedConfigSchema.extend({
  accessTokenTtlSeconds: z.number().int().min(60).max(3600).default(600),
  refreshTokenTtlDays: z.number().int().min(1).max(90).default(7),
  serviceTokenTtlSeconds: z.number().int().min(60).max(3600).default(300),
});

export const config =
  env.NODE_ENV === 'test'
    ? staticConfig(configSchema)
    : await loadConfig({
        consulUrl: env.CONSUL_HTTP_ADDR,
        service: 'identity',
        schema: configSchema,
      });
