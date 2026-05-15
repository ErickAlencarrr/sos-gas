import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();
    const { date } = body; // date is expected as YYYY-MM-DD

    if (date) {
      // Apagar de um dia específico
      // Ajustando fuso para apagar o dia selecionado corretamente no fuso do Brasil
      const startOfDay = new Date(`${date}T00:00:00.000-03:00`);
      const endOfDay = new Date(`${date}T23:59:59.999-03:00`);

      await prisma.$transaction([
        prisma.bill.deleteMany({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } }
        }),
        prisma.transaction.deleteMany({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } }
        }),
        prisma.dailyClosing.deleteMany({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } }
        })
      ]);

      return NextResponse.json({ message: `Histórico de ${date} apagado com sucesso` });
    } else {
      // Apagar tudo (Transactions, Bills e DailyClosings) mantendo Usuarios, Produtos e Clientes
      await prisma.$transaction([
        prisma.bill.deleteMany(),
        prisma.transaction.deleteMany(),
        prisma.dailyClosing.deleteMany()
      ]);

      return NextResponse.json({ message: 'Todo o histórico foi apagado com sucesso' });
    }

  } catch (error) {
    return NextResponse.json({ error: 'Erro ao apagar histórico' }, { status: 500 });
  }
}