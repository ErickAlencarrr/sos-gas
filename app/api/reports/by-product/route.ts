import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionOrBearer } from '@/lib/getSessionOrBearer';

function brDateBoundary(dateStr: string, end: boolean) {
  return new Date(`${dateStr}T${end ? '23:59:59.999' : '00:00:00.000'}-03:00`);
}

function todayBR() {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export async function GET(req: Request) {
  try {
    const session = await getSessionOrBearer(req);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const url = new URL(req.url);
    const today = todayBR();
    const from = url.searchParams.get('from') || `${today.slice(0, 7)}-01`;
    const to = url.searchParams.get('to') || today;

    const startDate = brDateBoundary(from, false);
    const endDate = brDateBoundary(to, true);

    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'OUT',
        createdAt: { gte: startDate, lte: endDate },
      },
      include: { product: true },
    });

    const map = new Map<string, { productId: string; productName: string; totalQuantity: number; totalRevenue: number }>();
    for (const tx of transactions) {
      const key = tx.productId;
      if (!map.has(key)) {
        map.set(key, { productId: key, productName: tx.product.name, totalQuantity: 0, totalRevenue: 0 });
      }
      const entry = map.get(key)!;
      entry.totalQuantity += tx.quantity;
      entry.totalRevenue += tx.price || 0;
    }

    const products = Array.from(map.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
    const totalQuantity = products.reduce((acc, p) => acc + p.totalQuantity, 0);
    const totalRevenue = products.reduce((acc, p) => acc + p.totalRevenue, 0);

    return NextResponse.json({ from, to, products, totalQuantity, totalRevenue });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar vendas por produto' }, { status: 500 });
  }
}
