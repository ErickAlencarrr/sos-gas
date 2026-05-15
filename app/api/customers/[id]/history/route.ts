import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;

    // Busca as transações de saída vinculadas a esse cliente
    const transactions = await prisma.transaction.findMany({
      where: { 
        customerId: id,
        type: 'OUT' 
      },
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar histórico do cliente' }, { status: 500 });
  }
}
