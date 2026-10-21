import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();

  console.log(`Trouvé ${users.length} utilisateurs. Hashage en cours...`);

  for (const user of users) {
    // Si le mot de passe est déjà hashé (longueur ~60), on saute
    if (user.password && user.password.length > 50) {
      console.log(`⏭️  ${user.email} déjà hashé`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(user.password || 'password123', 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    console.log(`✅ ${user.email} hashé avec succès`);
  }

  console.log('🎉 Tous les mots de passe ont été hashés !');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());