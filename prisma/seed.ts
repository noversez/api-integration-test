import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    throw new Error('SECRET_KEY is not set in .env');
  }

  await prisma.user.upsert({
    where: { id: 11 },
    update: {},
    create: {
      id: 11,
      username: 'test11user11',
      email: 'user11@el.com',
      last_login: new Date(),
      externalApiAccounts: {
        create: {
          external_user_id: '11', // user-id во внешнем API
          external_secret_key: secretKey, // ключ
          is_active: true,
        },
      },
      userBalance: {
        create: {
          balance: 1000,
          external_balance: 1000,
          last_checked_at: new Date(),
        },
      },
    },
  });
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
