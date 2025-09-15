import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin@123';
  if (adminEmail) {
    const password = await bcrypt.hash(adminPass, 10);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { password, role: 'ADMIN', name: 'Admin' },
      create: { email: adminEmail, password, role: 'ADMIN', name: 'Admin' },
    });
  } else {
    console.log('Seed: ADMIN_EMAIL não definido. Nenhum admin padrão criado.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


