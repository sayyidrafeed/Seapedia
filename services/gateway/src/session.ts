import { z } from 'zod';

export const introspectionSchema = z.discriminatedUnion('active', [
  z.object({
    active: z.literal(true),
    userId: z.string(),
    sessionId: z.string(),
    activeRole: z.string(),
  }),
  z.object({ active: z.literal(false) }),
]);

export type Identity = { userId: string; sessionId: string; activeRole: string };
export type Introspect = (token: string) => Promise<z.infer<typeof introspectionSchema>>;

/**
 * Resolves session cookies through the identity service, with a short cache so most requests
 * cost no extra hop. Entries for a token are dropped whenever identity changes that session
 * (login, logout, role switch), so the TTL only bounds staleness for changes made elsewhere.
 */
export function createSessionResolver(introspect: Introspect, ttlMs: number, maxEntries = 10_000) {
  const cache = new Map<string, { identity: Identity | null; expiresAt: number }>();

  return {
    async resolve(token: string): Promise<Identity | null> {
      const hit = cache.get(token);
      if (hit && hit.expiresAt > Date.now()) return hit.identity;

      const result = await introspect(token);
      const identity = result.active
        ? { userId: result.userId, sessionId: result.sessionId, activeRole: result.activeRole }
        : null;

      if (ttlMs > 0) {
        if (cache.size >= maxEntries) cache.delete(cache.keys().next().value as string);
        cache.set(token, { identity, expiresAt: Date.now() + ttlMs });
      }
      return identity;
    },
    forget(token: string) {
      cache.delete(token);
    },
  };
}

export type SessionResolver = ReturnType<typeof createSessionResolver>;
