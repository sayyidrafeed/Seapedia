import { getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { factory } from '@/lib/factory';
import { verifyJwt } from '@/lib/jwt';
import { db } from '@/db';
import { activeSession } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const requireSession = factory.createMiddleware(async (c, next) => {
  const token = getCookie(c, '__session');

  if (!token) {
    throw new HTTPException(401, { message: 'Unauthorized: No session token provided' });
  }

  const payload = await verifyJwt(token);
  if (!payload) {
    throw new HTTPException(401, { message: 'Unauthorized: Invalid or expired token' });
  }

  // Validate session existence in database
  const [session] = await db
    .select()
    .from(activeSession)
    .where(and(eq(activeSession.id, payload.sessionId), eq(activeSession.userId, payload.userId)))
    .limit(1);

  if (!session) {
    throw new HTTPException(401, { message: 'Unauthorized: Session is inactive' });
  }

  c.set('userId', payload.userId);
  c.set('sessionId', payload.sessionId);
  c.set('activeRole', session.activeRole);

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

export function requirePermission(_resource: string, _actions: string[]) {
  return factory.createMiddleware(async (_c, next) => {
    await next();
  });
}
