import { getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { factory } from '../factory';
import type { SessionDenylist } from './denylist';
import { ACCESS_COOKIE, type TokenVerifier } from './tokens';

/**
 * Resolves the caller's user identity from the access token (cookie, or bearer for API
 * clients). Invalid, expired, or revoked tokens leave the request anonymous; routes that need a
 * user then answer 401 through `requireSession`.
 */
export function authenticate(verifier: TokenVerifier, denylist: SessionDenylist) {
  return factory.createMiddleware(async (c, next) => {
    const header = c.req.header('authorization');
    const token =
      getCookie(c, ACCESS_COOKIE) ?? (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
    if (token) {
      const user = await verifier.user(token);
      if (user && !denylist.isRevoked(user.sessionId)) {
        c.set('userId', user.userId);
        c.set('sessionId', user.sessionId);
        c.set('roles', user.roles);
        c.set('activeRole', user.activeRole);
      }
    }
    await next();
  });
}

export const requireSession = factory.createMiddleware(async (c, next) => {
  if (!c.get('userId')) {
    throw new HTTPException(401, { message: 'Unauthorized: No active session' });
  }
  await next();
});

export function requireRole(allowedRole: string) {
  return factory.createMiddleware(async (c, next) => {
    if (c.get('activeRole') !== allowedRole) {
      throw new HTTPException(403, { message: `Forbidden: Requires role '${allowedRole}'` });
    }
    await next();
  });
}

/**
 * Guards service-to-service routes: the caller must present a service token issued by identity
 * for this service (`audience`) carrying `scope`.
 */
export function requireServiceScope(verifier: TokenVerifier, audience: string, scope: string) {
  return factory.createMiddleware(async (c, next) => {
    const header = c.req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const caller = token ? await verifier.service(token, audience) : null;
    if (!caller) throw new HTTPException(401, { message: 'Unauthorized: service token required' });
    if (!caller.scopes.includes(scope)) {
      throw new HTTPException(403, { message: `Forbidden: requires scope '${scope}'` });
    }
    c.set('serviceClient', caller.client);
    await next();
  });
}
