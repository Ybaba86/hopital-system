import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding doctor availabilities...');
  const doctors = await prisma.user.findMany({ where: { role: 'MEDECIN' } });
  
  for (const doc of doctors) {
    // Generate Monday(1) to Friday(5)
    const availabilities = [1, 2, 3, 4, 5].map(day => ({
      doctorId: doc.id,
      dayOfWeek: day,
      startTime: '08:00',
      endTime: '18:00'
    }));
    
    // Check if they already have availabilities
    const existing = await prisma.doctorAvailability.findFirst({ where: { doctorId: doc.id } });
    if (!existing) {
      await prisma.doctorAvailability.createMany({ data: availabilities });
      console.log(`✅ Seeded availability for Dr. ${doc.name}`);
    }
  }
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
