import { loadConfig, staticConfig } from '@seapedia/platform/consul';
import { z } from 'zod';
import { env } from './env';

// Non-secret tunables from Consul KV (`config/shared/*`, `config/identity/*`).
export const configSchema = z.object({
  accessTokenTtlSeconds: z.number().int().min(60).max(3600).default(600),
  refreshTokenTtlDays: z.number().int().min(1).max(90).default(7),
  serviceTokenTtlSeconds: z.number().int().min(60).max(3600).default(300),
  outboxIntervalMs: z.number().int().min(100).default(500),
});

export const config =
  env.NODE_ENV === 'test'
    ? staticConfig(configSchema)
    : await loadConfig({
        consulUrl: env.CONSUL_HTTP_ADDR,
        service: 'identity',
        schema: configSchema,
      });
