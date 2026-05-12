import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

    const bills = await prisma.bill.findMany({
      orderBy: { dueDate: 'asc' },
      include: { transaction: { include: { product: true } } }
    });
    return NextResponse.json(bills);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar contas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

    const { title, amount, dueDate, isPaid, isRecurring } = await req.json();

    const bill = await prisma.bill.create({
      data: {
        title,
        amount: amount ? parseFloat(amount) : null,
        dueDate: new Date(dueDate + "T12:00:00Z"),
        isPaid: isPaid || false,
        isRecurring: isRecurring || false,
      }
    });
    return NextResponse.json(bill);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
  }
}
