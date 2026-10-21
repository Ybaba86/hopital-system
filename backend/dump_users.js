const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'LABORANTIN' }
  });
  console.log("Laborantins actuels :", users.map(u => ({ email: u.email, name: u.name, hospitalId: u.hospitalId })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
