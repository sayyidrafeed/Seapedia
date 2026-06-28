import { db } from './index';
import { users, userRole, activeSession } from './schema';

async function seed() {
  console.log('Seeding database with default accounts...');

  const adminUsername = 'admin';
  const adminEmail = 'admin@seapedia.com';
  const adminPassword = 'adminpassword';
  const adminHash = await Bun.password.hash(adminPassword, 'bcrypt');

  try {
    const [adminUser] = await db
      .insert(users)
      .values({
        username: adminUsername,
        email: adminEmail,
        passwordHash: adminHash,
        name: 'System Administrator',
      })
      .returning();

    await db.insert(userRole).values({
      userId: adminUser.id,
      role: 'admin',
    });

    await db.insert(activeSession).values({
      userId: adminUser.id,
      activeRole: 'admin',
    });

    console.log('Database seeded successfully!');
    console.log(`Admin credentials:`);
    console.log(`  Username: ${adminUsername}`);
    console.log(`  Email:    ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seed();
