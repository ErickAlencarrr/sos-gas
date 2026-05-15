import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { customerId, amount } = body;

    if (!customerId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Abate da dívida
    const newBalance = Math.max(0, customer.balance - Number(amount));

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: { balance: newBalance },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar pagamento' }, { status: 500 });
  }
}
