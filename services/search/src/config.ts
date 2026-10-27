import { loadConfig, staticConfig } from '@seapedia/platform/consul';
import { z } from 'zod';
import { env } from './env';

// Non-secret tunables from Consul KV (`config/shared/*`, `config/search/*`).
export const configSchema = z.object({
  fuzziness: z.string().default('AUTO'),
  soldCountBoost: z.number().min(0).default(0.1),
  ratingBoost: z.number().min(0).default(0.5),
});

export const config =
  env.NODE_ENV === 'test'
    ? staticConfig(configSchema)
    : await loadConfig({
        consulUrl: env.CONSUL_HTTP_ADDR,
        service: 'search',
        schema: configSchema,
      });
