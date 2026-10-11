import { users, userRole, activeSession } from '../schema';
import { rawUsers } from './data/users.data';
import type { Dbs } from '../dbs';

export async function seedUsers({ identity: tx }: Dbs) {
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

    // Seed active session (primary role is the first one)
    await tx.insert(activeSession).values({
      userId: insertedUser.id,
      activeRole: raw.roles[0],
      createdAt,
      updatedAt: createdAt,
    });
  }

  console.log(`Seeded ${rawUsers.length} users successfully.`);
  return userMap;
}
