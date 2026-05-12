import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

    const { name, email, password, role } = await req.json();
    const data: any = { name, email, role };
    
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data
    });
    return NextResponse.json({ id: user.id });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 });
  }
}
