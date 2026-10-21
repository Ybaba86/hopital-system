const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'LABORANTIN' }
  });
  console.log("Laborantins actuels :", users.map(u => ({ email: u.email, name: u.name, hospitalId: u.hospitalId })));

  if (users.length > 0 && !users[0].hospitalId) {
    const hospital = await prisma.hospital.findFirst();
    if (hospital) {
      console.log("Attribution de l'hôpital", hospital.name, "aux laborantins...");
      await prisma.user.updateMany({
        where: { role: 'LABORANTIN', hospitalId: null },
        data: { hospitalId: hospital.id }
      });
      console.log("Mise à jour terminée.");
    } else {
      console.log("Aucun hôpital trouvé dans la BDD !");
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
