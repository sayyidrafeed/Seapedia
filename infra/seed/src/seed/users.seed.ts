import { users, userRole, userRefs } from '../schema';
import { rawUsers } from './data/users.data';
import type { Dbs } from '../dbs';

export async function seedUsers({ identity: tx, commerce, catalog }: Dbs) {
  console.log('Seeding users...');

  const userMap = new Map<string, string>();

  // Hash standard password 'password123'
  const passwordHash = await Bun.password.hash('password123', 'bcrypt');

  for (const raw of rawUsers) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - raw.createdAtDaysAgo);

    const [insertedUser] = await tx
      .insert(users)
      .values({
        username: raw.username,
        email: raw.email,
        passwordHash,
        name: raw.name,
        isOnboarded: true,
        avatarKey: raw.avatarUrl,
        createdAt,
        updatedAt: createdAt,
      })
      .returning();

    userMap.set(raw.username, insertedUser.id);

    // Seed roles
    for (const role of raw.roles) {
      await tx.insert(userRole).values({
        userId: insertedUser.id,
        role,
        createdAt,
      });
    }

    // Replicas, normally filled from `identity.user.registered`.
    await commerce.insert(userRefs).values({ id: insertedUser.id, roles: raw.roles, version: 1 });
    await catalog
      .collection<{ _id: string } & Record<string, unknown>>('users')
      .insertOne({ _id: insertedUser.id, displayName: raw.name ?? raw.username, version: 1 });
  }

  console.log(`Seeded ${rawUsers.length} users successfully.`);
  return userMap;
}
