import { createEvent } from '@seapedia/platform/events';
import { createPostgresOutbox } from '@seapedia/platform/events/postgres';
import { db } from '@/db';
import { outbox } from '@/db/schema';

// identity's outbox: enqueue inside the transaction that made the change.
export const identityOutbox = createPostgresOutbox(db, outbox);

export type UserEventData = {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
};

export const IdentityEvents = {
  // Full current user profile; consumers keep replicas (reviewer names, role counts).
  user(
    kind: 'registered' | 'updated',
    user: { id: string; username: string; name: string | null; version: number },
    roles: string[],
  ) {
    return createEvent<UserEventData>(
      'identity',
      `identity.user.${kind}`,
      { id: user.id, username: user.username, displayName: user.name ?? user.username, roles },
      user.version,
    );
  },
  // Every service denies this session's access tokens until `expiresAt` (epoch seconds).
  sessionRevoked(sessionId: string, expiresAt: number) {
    return createEvent('identity', 'identity.session.revoked', { sessionId, expiresAt }, 0);
  },
};
