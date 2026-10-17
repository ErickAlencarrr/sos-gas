import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionOrBearer } from '@/lib/getSessionOrBearer';

export async function GET(req: Request) {
  try {
    const session = await getSessionOrBearer(req);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const pending = await prisma.transaction.findMany({
      where: { type: 'OUT', isPendingPickup: true },
      include: { product: true, customer: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(pending);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar retiradas pendentes' }, { status: 500 });
  }
}
