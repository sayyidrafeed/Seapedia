import { importSPKI, jwtVerify, type JWTPayload } from 'jose';
import { z } from 'zod';

export const ISSUER = 'seapedia-identity';
/** Audience of user access tokens: every public API behind the gateway. */
export const API_AUDIENCE = 'seapedia-api';
export const ACCESS_COOKIE = '__access';
export const REFRESH_COOKIE = '__refresh';

const accessClaims = z.object({
  sub: z.string(),
  sid: z.string(),
  roles: z.array(z.string()),
  role: z.string(),
  token_use: z.literal('access'),
  exp: z.number(),
});

const serviceClaims = z.object({
  sub: z.string(),
  scope: z.string(),
  token_use: z.literal('service'),
});

export type UserIdentity = {
  userId: string;
  sessionId: string;
  roles: string[];
  activeRole: string;
  expiresAt: number;
};

export type ServiceIdentity = { client: string; scopes: string[] };

/**
 * Verifies tokens issued by identity (RS256). Every service verifies on its own: the gateway's
 * check is the first line, not the only one.
 */
export function createTokenVerifier(publicKeyPem: string) {
  const key = importSPKI(publicKeyPem.replace(/\\n/g, '\n'), 'RS256');

  async function verify(token: string, audience: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, await key, {
        issuer: ISSUER,
        audience,
        algorithms: ['RS256'],
      });
      return payload;
    } catch {
      return null;
    }
  }

  return {
    async user(token: string): Promise<UserIdentity | null> {
      const parsed = accessClaims.safeParse(await verify(token, API_AUDIENCE));
      if (!parsed.success) return null;
      const c = parsed.data;
      return {
        userId: c.sub,
        sessionId: c.sid,
        roles: c.roles,
        activeRole: c.role,
        expiresAt: c.exp,
      };
    },
    /** A service token addressed to `audience` (the calling service's name is `sub`). */
    async service(token: string, audience: string): Promise<ServiceIdentity | null> {
      const parsed = serviceClaims.safeParse(await verify(token, audience));
      if (!parsed.success) return null;
      return { client: parsed.data.sub, scopes: parsed.data.scope.split(' ').filter(Boolean) };
    },
  };
}

export type TokenVerifier = ReturnType<typeof createTokenVerifier>;
