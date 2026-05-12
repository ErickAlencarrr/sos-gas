import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log("Usuários no BD:", users.map(u => ({ email: u.email, role: u.role, hash: u.password })));
  
  if (users.length > 0) {
    const isValid = await bcrypt.compare('123456', users[0].password);
    console.log("A senha '123456' bate com o hash do admin?", isValid);
  }
}

check().finally(() => prisma.$disconnect());
