import { createHash, timingSafeEqual } from 'node:crypto';
import { eq, notInArray } from 'drizzle-orm';
import { db } from '@/db';
import { serviceClients } from '@/db/schema';
import { env } from '@/env';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export class OAuthService {
  // The environment is the source of truth: a client removed from it can no longer get tokens.
  static async syncClients() {
    const clients = Object.entries(env.SERVICE_CLIENT_SECRETS).map(([clientId, secret]) => ({
      clientId,
      secretHash: sha256(secret),
    }));
    await db.transaction(async (tx) => {
      const ids = clients.map((c) => c.clientId);
      await (ids.length > 0
        ? tx.delete(serviceClients).where(notInArray(serviceClients.clientId, ids))
        : tx.delete(serviceClients));
      for (const client of clients) {
        await tx
          .insert(serviceClients)
          .values(client)
          .onConflictDoUpdate({
            target: serviceClients.clientId,
            set: { secretHash: client.secretHash, updatedAt: new Date() },
          });
      }
    });
  }

  static async authenticate(clientId: string, secret: string) {
    const [client] = await db
      .select({ secretHash: serviceClients.secretHash })
      .from(serviceClients)
      .where(eq(serviceClients.clientId, clientId))
      .limit(1);
    return (
      client !== undefined &&
      timingSafeEqual(Buffer.from(client.secretHash), Buffer.from(sha256(secret)))
    );
  }
}
