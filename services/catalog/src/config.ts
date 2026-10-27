import { loadConfig, staticConfig } from '@seapedia/platform/consul';
import { z } from 'zod';
import { env } from './env';

// Non-secret tunables from Consul KV (`config/shared/*`, `config/catalog/*`).
export const configSchema = z.object({
  searchEnabled: z.boolean().default(true),
  searchTimeoutMs: z.number().int().min(50).max(10_000).default(500),
  outboxIntervalMs: z.number().int().min(100).default(500),
});

export const config =
  env.NODE_ENV === 'test'
    ? staticConfig(configSchema)
    : await loadConfig({
        consulUrl: env.CONSUL_HTTP_ADDR,
        service: 'catalog',
        schema: configSchema,
      });
