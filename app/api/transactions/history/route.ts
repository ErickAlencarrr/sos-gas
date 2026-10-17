import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionOrBearer } from '@/lib/getSessionOrBearer';

export async function GET(req: Request) {
  try {
    const session = await getSessionOrBearer(req);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

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
