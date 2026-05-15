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

    // Deleta os produtos. Isso também pode falhar se houver transações amarradas a eles por conta de restrições de foreign key,
    // mas o onDelete: Cascade não está configurado na Transaction. Então, precisamos apagar as transações primeiro,
    // ou assumir que o "Apagar Produtos" só será rodado num banco limpo. Para segurança, vamos apagar as transações e fechamentos antes.
    await prisma.$transaction([
      prisma.transaction.deleteMany(),
      prisma.dailyClosing.deleteMany(),
      prisma.bill.deleteMany(),
      prisma.product.deleteMany()
    ]);

    return NextResponse.json({ message: 'Produtos apagados com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao apagar produtos' }, { status: 500 });
  }
}