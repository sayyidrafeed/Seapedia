import { z } from 'zod';

const tokenResponse = z.object({ access_token: z.string(), expires_in: z.number() });

export type ServiceTokenOptions = {
  /** Resolves identity's base URL (via discovery). */
  identityUrl: () => Promise<string>;
  clientId: string;
  clientSecret: string;
};

/**
 * OAuth2 client-credentials: this service's identity toward another service. Tokens are cached
 * per audience until shortly before they expire.
 */
export function createServiceTokenProvider({
  identityUrl,
  clientId,
  clientSecret,
}: ServiceTokenOptions) {
  const cache = new Map<string, { token: string; refreshAt: number }>();

  return async function tokenFor(audience: string, scope: string): Promise<string> {
    const key = `${audience} ${scope}`;
    const hit = cache.get(key);
    if (hit && hit.refreshAt > Date.now()) return hit.token;

    const res = await fetch(new URL('/oauth/token', await identityUrl()), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        audience,
        scope,
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`service token for ${audience} failed: ${res.status}`);
    const body = tokenResponse.parse(await res.json());
    cache.set(key, {
      token: body.access_token,
      refreshAt: Date.now() + (body.expires_in - 30) * 1000,
    });
    return body.access_token;
  };
}

export type ServiceTokenProvider = ReturnType<typeof createServiceTokenProvider>;
