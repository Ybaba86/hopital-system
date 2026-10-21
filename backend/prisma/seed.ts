import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed Supabase...');

  // 1. Hôpital
  const hospital = await prisma.hospital.upsert({
    where: { id: 'h1' },
    update: {},
    create: {
      id: 'h1',
      name: 'Hôpital Niang',
      address: 'Dakar, Sénégal',
    },
  });
  console.log('✅ Hôpital créé :', hospital.name);

  // 2. Services
  const serviceNames = [
    'Médecine Générale',
    'Cardiologie',
    'Pédiatrie',
    'Laboratoire',
    'Urgences',
    'Pharmacie',
  ];

  for (const name of serviceNames) {
    try {
      await prisma.service.create({
        data: {
          name,
          hospitalId: hospital.id,
        },
      });
    } catch (e) {
      // Ignore si déjà existant
    }
  }
  console.log('✅ Services créés');

  // 3. Pharmacie
  const pharmacy = await prisma.pharmacy.upsert({
    where: { id: 'pharm1' },
    update: {},
    create: {
      id: 'pharm1',
      name: 'Grande Pharmacie Niang',
      hospitalId: hospital.id,
    },
  });
  console.log('✅ Pharmacie créée');

  // 4. Laboratoire
  const lab = await prisma.laboratory.upsert({
    where: { id: 'lab1' },
    update: {},
    create: {
      id: 'lab1',
      name: 'Laboratoire Central Niang',
      hospitalId: hospital.id,
    },
  });
  console.log('✅ Laboratoire créé');

  // 5. Utilisateurs principaux
  const defaultPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // Médecin
  const doctor = await prisma.user.upsert({
    where: { email: 'medecin@niang.com' },
    update: {},
    create: {
      email: 'medecin@niang.com',
      password: defaultPassword,
      name: 'Dr. Amadou Niang',
      role: 'MEDECIN',
      hospitalId: hospital.id,
    },
  });

  // Disponibilités du médecin (du Lundi au Samedi, 08:00 - 18:00)
  for (let day = 1; day <= 6; day++) {
    await prisma.doctorAvailability.upsert({
      where: {
        doctorId_dayOfWeek: {
          doctorId: doctor.id,
          dayOfWeek: day,
        },
      },
      update: {},
      create: {
        doctorId: doctor.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '18:00',
      },
    });
  }
  console.log('✅ Médecin et disponibilités créés');

  // Caissier
  await prisma.user.upsert({
    where: { email: 'caissier@niang.com' },
    update: {},
    create: {
      email: 'caissier@niang.com',
      password: defaultPassword,
      name: 'Fatou Diop (Caisse)',
      role: 'CAISSIER',
      hospitalId: hospital.id,
    },
  });

  // Pharmacien
  await prisma.user.upsert({
    where: { email: 'pharmacien@niang.com' },
    update: {},
    create: {
      email: 'pharmacien@niang.com',
      password: defaultPassword,
      name: 'Moussa Ndiaye (Pharmacie)',
      role: 'PHARMACIEN',
      hospitalId: hospital.id,
      pharmacyId: pharmacy.id,
    },
  });

  // Laborantin
  await prisma.user.upsert({
    where: { email: 'laborantin@niang.com' },
    update: {},
    create: {
      email: 'laborantin@niang.com',
      password: defaultPassword,
      name: 'Aïssatou Diallo (Laboratoire)',
      role: 'LABORANTIN',
      hospitalId: hospital.id,
      laboratoryId: lab.id,
    },
  });

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@niang.com' },
    update: {},
    create: {
      email: 'admin@niang.com',
      password: adminPassword,
      name: 'Administrateur Général',
      role: 'ADMIN',
      hospitalId: hospital.id,
    },
  });
  console.log('✅ Personnel hospitalier créé (Médecin, Caissier, Pharmacien, Laborantin, Admin)');

  // 6. Médicaments en stock pour la pharmacie
  const medicines = [
    { name: 'Paracétamol 500mg (Boîte 16)', price: 1500, stock: 150, description: 'Antalgique et antipyrétique' },
    { name: 'Doliprane 1000mg', price: 2000, stock: 100, description: 'Antalgique puissant' },
    { name: 'Amoxicilline 500mg', price: 3500, stock: 80, description: 'Antibiotique à large spectre' },
    { name: 'Ibuprofène 400mg', price: 2500, stock: 90, description: 'Anti-inflammatoire' },
    { name: 'Sirop Toux Sèche 150ml', price: 3000, stock: 45, description: 'Sirop antitussif' },
    { name: 'Vitamine C 1000mg', price: 2200, stock: 120, description: 'Complément vitaminé' },
  ];

  for (const med of medicines) {
    try {
      await prisma.medicine.create({
        data: {
          name: med.name,
          price: med.price,
          stock: med.stock,
          description: med.description,
          pharmacyId: pharmacy.id,
        },
      });
    } catch (e) {
      // Déjà existant
    }
  }
  console.log('✅ Médicaments initialisés en pharmacie');

  // 7. Patients de test
  const patientPassword = await bcrypt.hash('123456', 10);
  const patient1 = await prisma.patient.upsert({
    where: { uniqueNumber: 'PAT-20260001' },
    update: {},
    create: {
      uniqueNumber: 'PAT-20260001',
      firstName: 'Baba',
      lastName: 'Niang',
      email: 'baba@gmail.com',
      password: patientPassword,
      phone: '771234567',
      bloodGroup: 'O+',
      allergies: 'Pénicilline',
      familyHistory: 'Diabète type 2',
      hospitalId: hospital.id,
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { uniqueNumber: 'PAT-20260002' },
    update: {},
    create: {
      uniqueNumber: 'PAT-20260002',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      password: patientPassword,
      phone: '778901234',
      bloodGroup: 'A+',
      allergies: 'Aucune',
      familyHistory: 'Hypertension artérielle',
      hospitalId: hospital.id,
    },
  });
  console.log('✅ Patients de test créés (baba@gmail.com / jean.dupont@example.com)');

  console.log('🎉 Seed Supabase terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed :', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });