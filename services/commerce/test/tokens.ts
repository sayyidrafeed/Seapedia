import { API_AUDIENCE, ISSUER } from '@seapedia/platform/auth';
import { importPKCS8, SignJWT } from 'jose';

/** An access token as identity would issue it, for route tests. */
export async function accessCookie(role: string, userId = 'test-user') {
  const key = await importPKCS8(process.env.TEST_JWT_PRIVATE_KEY!, 'RS256');
  const token = await new SignJWT({ sid: 'test-session', roles: [role], role, token_use: 'access' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(ISSUER)
    .setAudience(API_AUDIENCE)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(key);
  return `__access=${token}`;
}
