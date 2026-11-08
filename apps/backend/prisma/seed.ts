import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function seed() {
  const email = process.env.ADMIN_EMAIL || 'admin@kumpul.local';
  const password = process.env.ADMIN_PASSWORD || 'admin123456';

  const passwordHash = await argon2.hash(password);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      username: 'admin',
      displayName: 'Administrator',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`Admin user seeded: ${email}`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
