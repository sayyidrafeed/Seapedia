import { db } from './index';
import { users, userRole, activeSession, systemTimeOffset, stores, wallets } from './schema';
import { inArray } from 'drizzle-orm';

async function seed() {
  console.log('Seeding database with default accounts...');

  const accounts = [
    {
      username: 'admin',
      email: 'admin@seapedia.com',
      password: 'admin123',
      name: 'System Administrator',
      roles: ['admin'],
    },
    {
      username: 'seller1',
      email: 'seller1@seapedia.com',
      password: 'seller123',
      name: 'John Seller',
      roles: ['seller'],
    },
    {
      username: 'buyer1',
      email: 'buyer1@seapedia.com',
      password: 'buyer123',
      name: 'Jane Buyer',
      roles: ['buyer'],
    },
    {
      username: 'driver1',
      email: 'driver1@seapedia.com',
      password: 'driver123',
      name: 'Bob Driver',
      roles: ['driver'],
    },
    {
      username: 'multirole',
      email: 'multirole@seapedia.com',
      password: 'multi123',
      name: 'Alice Multirole',
      roles: ['seller', 'buyer', 'driver'],
    },
  ];

  try {
    // 1. Clean up existing seeded users
    const usernames = accounts.map((a) => a.username);
    await db.delete(users).where(inArray(users.username, usernames));

    // 2. Insert users and their profiles
    for (const acc of accounts) {
      const hash = await Bun.password.hash(acc.password, 'bcrypt');
      const [insertedUser] = await db
        .insert(users)
        .values({
          username: acc.username,
          email: acc.email,
          passwordHash: hash,
          name: acc.name,
          isOnboarded: true,
        })
        .returning();

      // Seed roles
      for (const role of acc.roles) {
        await db.insert(userRole).values({
          userId: insertedUser.id,
          role,
        });
      }

      // Seed active session
      const primaryRole = acc.roles[0];
      await db.insert(activeSession).values({
        userId: insertedUser.id,
        activeRole: primaryRole,
      });

      // Seed store if user is a seller
      if (acc.roles.includes('seller')) {
        await db.insert(stores).values({
          sellerId: insertedUser.id,
          name: `${acc.name}'s Store`,
          slug: `${acc.username}-store`,
          description: `Welcome to ${acc.name}'s official store!`,
        });
      }

      // Seed wallet if user is not admin
      if (!acc.roles.includes('admin')) {
        await db.insert(wallets).values({
          userId: insertedUser.id,
          balance: 0,
        });
      }
    }

    // 3. Ensure system time offset exists
    await db
      .insert(systemTimeOffset)
      .values({
        id: 1,
        offsetSeconds: 0,
      })
      .onConflictDoNothing();

    console.log('Database seeded successfully!');
    console.log('Credentials seeded:');
    for (const acc of accounts) {
      console.log(
        `  - Username: ${acc.username} | Password: ${acc.password} | Roles: ${acc.roles.join(', ')}`,
      );
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seed();
