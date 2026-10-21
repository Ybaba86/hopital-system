const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const labs = await prisma.laboratory.findMany();
  console.log("Laboratories:", labs);
  const labResults = await prisma.labResult.findMany();
  console.log("Lab Results:", labResults);
}

main().finally(() => prisma.$disconnect());
