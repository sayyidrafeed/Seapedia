import { API_AUDIENCE, ISSUER } from '@seapedia/platform/auth';
import { exportJWK, importPKCS8, importSPKI, SignJWT } from 'jose';
import { config } from '@/config';
import { env } from '@/env';

const pem = (value: string) => value.replace(/\\n/g, '\n');
const privateKey = importPKCS8(pem(env.JWT_PRIVATE_KEY), 'RS256');
const KEY_ID = 'seapedia-1';

// Short-lived user access token: what Kong and every service verify.
export async function signAccessToken(claims: {
  userId: string;
  sessionId: string;
  roles: string[];
  activeRole: string;
}) {
  const ttl = config.get().accessTokenTtlSeconds;
  const token = await new SignJWT({
    sid: claims.sessionId,
    roles: claims.roles,
    role: claims.activeRole,
    token_use: 'access',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: KEY_ID })
    .setIssuer(ISSUER)
    .setAudience(API_AUDIENCE)
    .setSubject(claims.userId)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(await privateKey);
  return { token, expiresAt: Math.floor(Date.now() / 1000) + ttl, ttl };
}

// Client-credentials token: `client` may call `audience` with `scopes`.
export async function signServiceToken(client: string, audience: string, scopes: string[]) {
  const ttl = config.get().serviceTokenTtlSeconds;
  const token = await new SignJWT({ scope: scopes.join(' '), token_use: 'service' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: KEY_ID })
    .setIssuer(ISSUER)
    .setAudience(audience)
    .setSubject(client)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(await privateKey);
  return { token, ttl };
}

// Public key set for anyone verifying identity's tokens.
export async function jwks() {
  const jwk = await exportJWK(
    await importSPKI(pem(env.JWT_PUBLIC_KEY), 'RS256', { extractable: true }),
  );
  return { keys: [{ ...jwk, kid: KEY_ID, use: 'sig', alg: 'RS256' }] };
}
