import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Obter data de hoje iniciando à meia-noite local
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const outTransactions = await prisma.transaction.findMany({
      where: {
        type: 'OUT',
        createdAt: { gte: today },
      },
    });

    const totalSales = outTransactions.reduce((acc, tx) => acc + tx.quantity, 0);
    const totalRevenue = outTransactions.reduce((acc, tx) => acc + (tx.price || 0), 0);
    
    const pixTotal = outTransactions.filter(t => t.paymentMethod === 'PIX').reduce((acc, tx) => acc + (tx.price || 0), 0);
    const cashTotal = outTransactions.filter(t => t.paymentMethod === 'CASH').reduce((acc, tx) => acc + (tx.price || 0), 0);
    const cardTotal = outTransactions.filter(t => t.paymentMethod === 'CARD').reduce((acc, tx) => acc + (tx.price || 0), 0);

    return NextResponse.json({
      totalSales,
      totalRevenue,
      pixTotal,
      cashTotal,
      cardTotal
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar resumo' }, { status: 500 });
  }
}
