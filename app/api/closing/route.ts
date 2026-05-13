import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas a Diretoria pode ver relatórios.' }, { status: 403 });
    }

    const closings = await prisma.dailyClosing.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(closings);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar fechamentos' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas a Diretoria pode fechar o caixa.' }, { status: 403 });
    }

    const now = new Date();
    const options = { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
    const parts = new Intl.DateTimeFormat('pt-BR', options).formatToParts(now);
    const dateMap = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const startOfToday = new Date(`${dateMap.year}-${dateMap.month}-${dateMap.day}T00:00:00.000-03:00`);

    const outTransactions = await prisma.transaction.findMany({
      where: {
        type: 'OUT',
        createdAt: { gte: startOfToday },
      },
    });

    const totalSales = outTransactions.reduce((acc, tx) => acc + tx.quantity, 0);
    const totalRevenue = outTransactions.reduce((acc, tx) => acc + (tx.price || 0), 0);
    const pixTotal = outTransactions.filter(t => t.paymentMethod === 'PIX').reduce((acc, tx) => acc + (tx.price || 0), 0);
    const cashTotal = outTransactions.filter(t => t.paymentMethod === 'CASH').reduce((acc, tx) => acc + (tx.price || 0), 0);
    const cardTotal = outTransactions.filter(t => t.paymentMethod === 'CARD').reduce((acc, tx) => acc + (tx.price || 0), 0);
    
    // Obtém o estoque total atual
    const products = await prisma.product.findMany();
    const finalStock = products.reduce((acc, p) => acc + p.currentStock, 0);

    const closing = await prisma.dailyClosing.create({
      data: {
        initialStock: 0, // Poderia cruzar com o fechamento anterior
        finalStock,
        totalSales,
        totalRevenue,
        pixTotal,
        cashTotal,
        cardTotal,
        isClosed: true,
      },
    });

    return NextResponse.json(closing);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao fechar caixa' }, { status: 500 });
  }
}

