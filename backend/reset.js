const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('1234567890', 10);
  await prisma.user.update({
    where: { email: 'adama@gmail.com' },
    data: { password: hashedPassword }
  });
  console.log("Password updated to 1234567890");

  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'adama@gmail.com', password: '1234567890' })
  });
  const data = await res.json();
  console.log("Login API response:", res.status, data);
}
main().catch(console.error).finally(() => prisma.$disconnect());
