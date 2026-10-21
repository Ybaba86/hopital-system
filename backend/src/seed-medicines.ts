import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const medicines = [
  { name: 'Paracétamol 500mg', description: 'Antalgique et antipyrétique', price: 1500, stock: 200, supplier: 'PharmaPlus' },
  { name: 'Amoxicilline 500mg', description: 'Antibiotique à large spectre', price: 2500, stock: 150, supplier: 'BioSanté' },
  { name: 'Ibuprofène 400mg', description: 'Anti-inflammatoire non stéroïdien', price: 2000, stock: 180, supplier: 'MediCare' },
  { name: 'Vitamine C 1000mg', description: 'Supplément vitaminique', price: 1200, stock: 300, supplier: 'VitaLab' },
  { name: 'Oméprazole 20mg', description: 'Inhibiteur de la pompe à protons', price: 3000, stock: 100, supplier: 'GastroPharma' },
  { name: 'Diclofénac 50mg', description: 'Anti-inflammatoire', price: 1800, stock: 120, supplier: 'MediCare' },
  { name: 'Arthemether-Lumefantrine 20/120', description: 'Antipaludique', price: 3500, stock: 150, supplier: 'Afrimed' },
  { name: 'Ciprofloxacine 500mg', description: 'Antibiotique', price: 4000, stock: 90, supplier: 'BioSanté' },
  { name: 'Azithromycine 500mg', description: 'Antibiotique', price: 4500, stock: 80, supplier: 'BioSanté' },
  { name: 'Spasfon (Phloroglucinol)', description: 'Antispasmodique', price: 2200, stock: 110, supplier: 'PharmaPlus' },
  { name: 'Doliprane 1000mg', description: 'Antalgique', price: 1800, stock: 250, supplier: 'PharmaPlus' },
  { name: 'Fervex Enfant', description: 'Traitement du rhume', price: 2500, stock: 60, supplier: 'VitaLab' },
  { name: 'Smecta', description: 'Antidiarrhéique', price: 2000, stock: 140, supplier: 'GastroPharma' },
  { name: 'Loratadine 10mg', description: 'Antihistaminique', price: 1500, stock: 130, supplier: 'MediCare' },
  { name: 'Cétirizine 10mg', description: 'Antiallergique', price: 1600, stock: 120, supplier: 'MediCare' },
  { name: 'Mébendazole 100mg', description: 'Antiparasitaire', price: 1200, stock: 95, supplier: 'Afrimed' },
  { name: 'Clamoxyl 1g', description: 'Antibiotique', price: 3500, stock: 75, supplier: 'BioSanté' },
  { name: 'Efferalgan 500mg', description: 'Antalgique', price: 1500, stock: 200, supplier: 'PharmaPlus' },
  { name: 'Aspirine 500mg', description: 'Antalgique, antipyrétique', price: 1000, stock: 150, supplier: 'PharmaPlus' },
  { name: 'Malox', description: 'Anti-acide', price: 2800, stock: 85, supplier: 'GastroPharma' },
];

async function main() {
  console.log('Début de la création du stock initial de la pharmacie...');
  let count = 0;
  for (const med of medicines) {
    const existing = await prisma.medicine.findUnique({ where: { name: med.name } });
    if (!existing) {
      await prisma.medicine.create({
        data: {
          ...med,
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)) // +2 ans
        }
      });
      count++;
    }
  }
  console.log(`✅ Terminé ! ${count} médicaments ajoutés au stock.`);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
