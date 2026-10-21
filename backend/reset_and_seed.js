const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Démarrage du nettoyage de la base de données...");

  // Delete transaction to avoid partial deletes
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.saleItem.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.queueTicket.deleteMany(),
    prisma.hospitalization.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.labResult.deleteMany(),
    prisma.prescription.deleteMany(),
    prisma.consultation.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.medicine.deleteMany(),
  ]);

  console.log("✅ Toutes les données de test liées aux patients et transactions ont été supprimées.");

  // Seed Medicines for Pharmacie BAMAKO
  let bamakoPharmacy = await prisma.pharmacy.findFirst({
    where: { name: { contains: "BAMAKO", mode: 'insensitive' } }
  });

  if (!bamakoPharmacy) {
    console.log("⚠️ Pharmacie BAMAKO non trouvée. Création d'une nouvelle pharmacie BAMAKO...");
    bamakoPharmacy = await prisma.pharmacy.create({
      data: { name: "Pharmacie BAMAKO" }
    });
  }

  console.log(`Ajout de médicaments pour la pharmacie : ${bamakoPharmacy.name} (ID: ${bamakoPharmacy.id})`);

  const medicines = [
    { name: "Paracétamol 500mg", description: "Douleurs et fièvre", stock: 150, price: 500 },
    { name: "Amoxicilline 1g", description: "Antibiotique", stock: 100, price: 1500 },
    { name: "Ibuprofène 400mg", description: "Anti-inflammatoire", stock: 120, price: 800 },
    { name: "Vitamine C", description: "Complément", stock: 200, price: 600 },
    { name: "Artemether Lumefantrine", description: "Antipaludique", stock: 50, price: 1200 },
    { name: "Metformine 850mg", description: "Antidiabétique", stock: 80, price: 2000 },
    { name: "Amlodipine 5mg", description: "Antihypertenseur", stock: 90, price: 1800 },
    { name: "Oméprazole 20mg", description: "Maux d'estomac", stock: 110, price: 1000 },
    { name: "Diclofénac gel", description: "Douleurs articulaires", stock: 40, price: 900 },
    { name: "Sirop Toux Sèche", description: "Antitussif", stock: 60, price: 1500 },
  ];

  for (const med of medicines) {
    await prisma.medicine.create({
      data: {
        ...med,
        pharmacyId: bamakoPharmacy.id
      }
    });
  }

  console.log("✅ Médicaments ajoutés avec succès !");
}

main()
  .catch((e) => {
    console.error("Erreur lors de l'exécution:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
