import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const customer = await prisma.customer.update({
      where: { id: id },
      data: { name },
    });

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao editar cliente' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;

    // Se o cliente tem transações vinculadas, elas ficarão órfãs de customerId (já que é opcional) 
    // ou precisaremos excluí-las ou falhar. Como o prisma schema tem relations(customerId),
    // se não tivermos onDelete: Cascade, o Prisma vai dar erro se tiver transação.
    // Vamos apenas tentar deletar.
    await prisma.customer.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir cliente. Verifique se há histórico.' }, { status: 500 });
  }
}
