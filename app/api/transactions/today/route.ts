import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Obter data de hoje no Brasil para evitar bugs de fuso horário da Vercel (UTC)
    const now = new Date();
    const options = { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
    const parts = new Intl.DateTimeFormat('pt-BR', options).formatToParts(now);
    const dateMap = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    
    // Cria a data de hoje à meia-noite (UTC-3)
    const startOfToday = new Date(`${dateMap.year}-${dateMap.month}-${dateMap.day}T00:00:00.000-03:00`);

    const outTransactions = await prisma.transaction.findMany({
      where: {
        type: 'OUT',
        dailyClosingId: null,
        createdAt: { gte: startOfToday },
      },
      include: {
        product: true,
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(outTransactions);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar vendas de hoje' }, { status: 500 });
  }
}
