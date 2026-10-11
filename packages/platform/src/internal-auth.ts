import { timingSafeEqual } from 'node:crypto';
import { HTTPException } from 'hono/http-exception';
import { factory } from './factory';

/**
 * Identity headers. Only the gateway sets them, after introspecting the session cookie with the
 * identity service. They are trusted only on requests that passed `requireInternal`.
 */
export const IDENTITY_HEADERS = {
  userId: 'x-user-id',
  sessionId: 'x-session-id',
  activeRole: 'x-active-role',
} as const;

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Rejects any request that does not carry the shared internal service token. */
export function requireInternal(token: string) {
  return factory.createMiddleware(async (c, next) => {
    const header = c.req.header('authorization') ?? '';
    const presented = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
    if (!presented || !safeEqual(presented, token)) {
      throw new HTTPException(401, { message: 'Unauthorized: internal access only' });
    }
    await next();
  });
}

/** Requires an authenticated user, as resolved by the gateway. */
export const requireSession = factory.createMiddleware(async (c, next) => {
  const userId = c.req.header(IDENTITY_HEADERS.userId);
  const sessionId = c.req.header(IDENTITY_HEADERS.sessionId);
  const activeRole = c.req.header(IDENTITY_HEADERS.activeRole);

  if (!userId || !sessionId || !activeRole) {
    throw new HTTPException(401, { message: 'Unauthorized: No active session' });
  }

  c.set('userId', userId);
  c.set('sessionId', sessionId);
  c.set('activeRole', activeRole);
  await next();
});

export function requireRole(allowedRole: string) {
  return factory.createMiddleware(async (c, next) => {
    const activeRole = c.get('activeRole');

    if (!activeRole || activeRole !== allowedRole) {
      throw new HTTPException(403, { message: `Forbidden: Requires role '${allowedRole}'` });
    }

    await next();
  });
}
