import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Limpa as tabelas para garantir um seed limpo
  await prisma.transaction.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()

  // 1. Criação de Usuários
  const hashedPassword = await bcrypt.hash('123456', 10)

  const admin = await prisma.user.create({
    data: {
      name: 'Diretoria',
      email: 'admin@sosgas.com.br',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const employee = await prisma.user.create({
    data: {
      name: 'Funcionário Padrão',
      email: 'func@sosgas.com.br',
      password: hashedPassword,
      role: 'EMPLOYEE',
    },
  })
  console.log(`👤 Usuários criados: admin@sosgas.com.br e func@sosgas.com.br (Senha: 123456)`)

  // 2. Criação de Produtos Iniciais
  const gas13 = await prisma.product.create({
    data: { name: 'Gás P13', type: 'GAS', currentStock: 50 },
  })

  const gas45 = await prisma.product.create({
    data: { name: 'Gás P45', type: 'GAS', currentStock: 15 },
  })

  const agua20 = await prisma.product.create({
    data: { name: 'Água 20L', type: 'WATER', currentStock: 100 },
  })

  console.log('✅ Seed finalizado com sucesso!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
