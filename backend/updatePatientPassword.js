const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Récupérer le patient par son email
  const patient = await prisma.patient.findFirst({
    where: { email: 'jean.dupont@example.com' }
  });
  if (!patient) {
    console.error('Patient non trouvé');
    return;
  }
  const hashed = await bcrypt.hash('1234', 10);
  const updated = await prisma.patient.update({
    where: { id: patient.id },
    data: { password: hashed },
  });
  console.log('Mot de passe mis à jour pour', updated.email);
}
main().catch(console.error);