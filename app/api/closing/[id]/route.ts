import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionOrBearer } from '@/lib/getSessionOrBearer';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getSessionOrBearer(req);
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

    const closing = await prisma.dailyClosing.findUnique({
      where: { id },
      include: {
        transactions: {
          include: {
            product: true,
            customer: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!closing) {
      return NextResponse.json({ error: 'Fechamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json(closing);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar fechamento' }, { status: 500 });
  }
}
