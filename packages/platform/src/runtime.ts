import { z } from 'zod';
import { createSessionDenylist } from './auth/denylist';
import { createServiceTokenProvider } from './auth/service-tokens';
import { createTokenVerifier } from './auth/tokens';
import { createResolver, registerService } from './consul/discovery';
import { createEventConsumer } from './events/consumer';
import { createRabbit } from './events/rabbit';

/** Bootstrap settings every service reads from its environment (secrets and addresses only). */
export const runtimeEnvSchema = z.object({
  PORT: z.coerce.number().int(),
  CONSUL_HTTP_ADDR: z.string().url(),
  /** Per-service RabbitMQ user: it may publish only its own routing keys. */
  RABBITMQ_URL: z.string().url(),
  /** identity's RS256 public key (PEM; `\n` escapes allowed). */
  JWT_PUBLIC_KEY: z.string().min(1),
  /** This service's client-credentials secret toward identity (not needed by identity itself). */
  SERVICE_CLIENT_SECRET: z.string().min(16).optional(),
  /** Address registered in Consul; defaults to the container IP. */
  SERVICE_ADDRESS: z.string().optional(),
});

export type RuntimeEnv = z.infer<typeof runtimeEnvSchema>;

/**
 * Shared infrastructure for one service process: token verification, session denylist (fed by
 * `identity.session.revoked`), RabbitMQ, client-side discovery, and service tokens.
 */
export function createRuntime(name: string, env: RuntimeEnv) {
  const verifier = createTokenVerifier(env.JWT_PUBLIC_KEY);
  const denylist = createSessionDenylist();
  const rabbit = createRabbit({ url: env.RABBITMQ_URL, service: name });
  const resolver = createResolver(env.CONSUL_HTTP_ADDR);
  const tokens = createServiceTokenProvider({
    identityUrl: () => resolver.resolve('identity'),
    clientId: name,
    clientSecret: env.SERVICE_CLIENT_SECRET ?? '',
  });

  const denylistConsumer = createEventConsumer({
    rabbit,
    handlers: {
      'identity.session.revoked': async (event) => {
        const data = event.data as { sessionId: string; expiresAt: number };
        denylist.revoke(data.sessionId, data.expiresAt);
      },
    },
  });

  return {
    name,
    env,
    verifier,
    denylist,
    rabbit,
    resolver,
    tokens,
    /** Serve HTTP, register in Consul, and start the session-revocation listener. */
    async start(fetchHandler: (req: Request) => Response | Promise<Response>) {
      Bun.serve({ fetch: fetchHandler, port: env.PORT });
      console.log(`${name} listening on :${env.PORT}`);
      denylistConsumer.start();
      const reg = await registerService({
        consulUrl: env.CONSUL_HTTP_ADDR,
        name,
        port: env.PORT,
        address: env.SERVICE_ADDRESS,
      });
      console.log(
        JSON.stringify({ service: name, event: 'registered', id: reg.id, address: reg.address }),
      );
    },
  };
}

export type Runtime = ReturnType<typeof createRuntime>;
