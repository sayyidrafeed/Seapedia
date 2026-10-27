import { loadConfig, sharedConfigSchema, staticConfig } from '@seapedia/platform/consul';
import { z } from 'zod';
import { env } from './env';

// Upper bound of any access token's lifetime, whatever the configuration was when it was issued.
// The session-revocation stream (infra/rabbitmq/init.ts) is retained this long too.
export const MAX_ACCESS_TOKEN_TTL_SECONDS = 3600;

// Non-secret tunables from Consul KV (`config/shared/*`, `config/identity/*`).
export const configSchema = sharedConfigSchema.extend({
  accessTokenTtlSeconds: z.number().int().min(60).max(MAX_ACCESS_TOKEN_TTL_SECONDS).default(600),
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
