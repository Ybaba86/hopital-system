const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'CAISSIER' }
  });
  console.log("Caissiers actuels :", users.map(u => ({ email: u.email, name: u.name, hospitalId: u.hospitalId })));

  if (users.length > 0 && !users[0].hospitalId) {
    const hospital = await prisma.hospital.findFirst();
    if (hospital) {
      console.log("Attribution de l'hôpital", hospital.name, "aux caissiers...");
      await prisma.user.updateMany({
        where: { role: 'CAISSIER', hospitalId: null },
        data: { hospitalId: hospital.id }
      });
      console.log("Mise à jour terminée.");
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
