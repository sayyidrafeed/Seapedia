// Revoked sessions, kept only until their access tokens would have expired anyway.
export function createSessionDenylist() {
  const revoked = new Map<string, number>();

  function prune(now: number) {
    for (const [sid, exp] of revoked) if (exp <= now) revoked.delete(sid);
  }

  return {
    revoke(sessionId: string, expiresAtSeconds: number) {
      revoked.set(sessionId, expiresAtSeconds);
      if (revoked.size > 10_000) prune(Date.now() / 1000);
    },
    isRevoked(sessionId: string) {
      const exp = revoked.get(sessionId);
      if (exp === undefined) return false;
      if (exp <= Date.now() / 1000) {
        revoked.delete(sessionId);
        return false;
      }
      return true;
    },
  };
}

export type SessionDenylist = ReturnType<typeof createSessionDenylist>;
