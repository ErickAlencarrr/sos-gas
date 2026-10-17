import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionOrBearer } from '@/lib/getSessionOrBearer';

export async function GET(req: Request) {
  try {
    const session = await getSessionOrBearer(req);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionOrBearer(request);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome do cliente é obrigatório' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: { name, balance: 0 },
    });

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
  }
}
