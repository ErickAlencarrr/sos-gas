import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: { product: true },
      take: 150 // Trazendo as últimas 150 movimentações para o relatório
    });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 });
  }
}
