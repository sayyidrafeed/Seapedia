import { loadConfig, sharedConfigSchema, staticConfig } from '@seapedia/platform/consul';
import { z } from 'zod';
import { env } from './env';

// Non-secret tunables from Consul KV (`config/shared/*`, `config/commerce/*`).
export const configSchema = sharedConfigSchema.extend({
  deliveryFees: z
    .object({ instant: z.number().int(), next_day: z.number().int(), regular: z.number().int() })
    .default({ instant: 30000, next_day: 15000, regular: 10000 }),
});

export const config =
  env.NODE_ENV === 'test'
    ? staticConfig(configSchema)
    : await loadConfig({
        consulUrl: env.CONSUL_HTTP_ADDR,
        service: 'commerce',
        schema: configSchema,
      });
