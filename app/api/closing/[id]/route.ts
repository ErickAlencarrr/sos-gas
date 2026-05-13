import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

    const closing = await prisma.dailyClosing.findUnique({
      where: { id }
    });

    if (!closing) {
      return NextResponse.json({ error: 'Fechamento não encontrado' }, { status: 404 });
    }

    // Obter inicio do dia do fechamento (fuso America/Sao_Paulo)
    const closingDate = new Date(closing.createdAt);
    const options = { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
    const parts = new Intl.DateTimeFormat('pt-BR', options).formatToParts(closingDate);
    const dateMap = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const startOfDay = new Date(`${dateMap.year}-${dateMap.month}-${dateMap.day}T00:00:00.000-03:00`);

    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'OUT',
        createdAt: {
          gte: startOfDay,
          lte: closing.createdAt,
        }
      },
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ ...closing, transactions });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar fechamento' }, { status: 500 });
  }
}
