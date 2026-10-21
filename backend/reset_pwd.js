const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { role: 'PHARMACIEN' },
    data: { password: 'password123' }
  });
  console.log('Updated users:', result.count);
}

main().finally(() => prisma.$disconnect());
