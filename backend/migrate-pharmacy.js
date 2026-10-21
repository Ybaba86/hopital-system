const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('--- Migration: Indépendance des Pharmacies ---');
  
  // 1. Créer une pharmacie principale par défaut
  let mainPharmacy = await prisma.pharmacy.findFirst();
  if (!mainPharmacy) {
    console.log('Création de la Pharmacie Principale...');
    mainPharmacy = await prisma.pharmacy.create({
      data: {
        name: 'Pharmacie Principale (Défaut)',
      }
    });
  }
  
  console.log(`ID Pharmacie Principale : ${mainPharmacy.id}`);

  // 2. Assigner cette pharmacie à tous les pharmaciens existants
  const updateUsers = await prisma.user.updateMany({
    where: { role: 'PHARMACIEN', pharmacyId: null },
    data: { pharmacyId: mainPharmacy.id }
  });
  console.log(`${updateUsers.count} compte(s) pharmacien(s) mis à jour.`);

  // 3. Assigner tous les médicaments existants à cette pharmacie
  const updateMedicines = await prisma.medicine.updateMany({
    where: { pharmacyId: null },
    data: { pharmacyId: mainPharmacy.id }
  });
  console.log(`${updateMedicines.count} médicament(s) assigné(s) à la pharmacie.`);

  // 4. Assigner toutes les ventes existantes à cette pharmacie
  const updateSales = await prisma.sale.updateMany({
    where: { pharmacyId: null },
    data: { pharmacyId: mainPharmacy.id }
  });
  console.log(`${updateSales.count} vente(s) assignée(s) à la pharmacie.`);

  console.log('--- Migration terminée avec succès ---');
  await prisma.$disconnect();
}

migrate().catch(e => {
  console.error(e);
  process.exit(1);
});
