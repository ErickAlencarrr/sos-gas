import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    await prisma.product.updateMany({
      data: {
        currentStock: 0,
        emptyStock: 0
      }
    });

    return NextResponse.json({ message: 'Estoque zerado com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao zerar estoque' }, { status: 500 });
  }
}