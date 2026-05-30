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
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });

    const totalSales = outTransactions.reduce((acc, tx) => acc + tx.quantity, 0);
    const totalRevenue = outTransactions.reduce((acc, tx) => acc + (tx.price || 0), 0);
    
    const pixTotal = outTransactions.reduce((acc, tx) => {
      if (tx.paymentMethod === 'SPLIT') return acc + (tx.pixPrice || 0);
      if (tx.paymentMethod === 'PIX') return acc + (tx.price || 0);
      return acc;
    }, 0);
    const cashTotal = outTransactions.reduce((acc, tx) => {
      if (tx.paymentMethod === 'SPLIT') return acc + (tx.cashPrice || 0);
      if (tx.paymentMethod === 'CASH') return acc + (tx.price || 0);
      return acc;
    }, 0);
    const cardTotal = outTransactions.reduce((acc, tx) => {
      if (tx.paymentMethod === 'SPLIT') return acc + (tx.cardPrice || 0);
      if (tx.paymentMethod === 'CARD') return acc + (tx.price || 0);
      return acc;
    }, 0);
    const clientTotal = outTransactions.reduce((acc, tx) => {
      if (tx.paymentMethod === 'SPLIT') return acc + (tx.clientPrice || 0);
      if (tx.paymentMethod === 'CLIENT') return acc + (tx.price || 0);
      return acc;
    }, 0);

    return NextResponse.json({
      totalSales,
      totalRevenue,
      pixTotal,
      cashTotal,
      cardTotal,
      clientTotal,
      transactions: outTransactions
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar resumo' }, { status: 500 });
  }
}
