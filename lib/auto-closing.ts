import prisma from '@/lib/prisma';

function getBRTDateString(date: Date): string {
  const options = { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
  const parts = new Intl.DateTimeFormat('pt-BR', options).formatToParts(date);
  const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function startOfBRTDay(dayStr: string): Date {
  return new Date(`${dayStr}T00:00:00.000-03:00`);
}

export type AutoClosingResult = {
  fechados: string[];
  mensagem: string;
};

export async function closeOrphanedDays(): Promise<AutoClosingResult> {
  const now = new Date();
  const todayStr = getBRTDateString(now);
  const startOfToday = startOfBRTDay(todayStr);

  // Busca todas as vendas não vinculadas a um fechamento de dias anteriores
  const orphaned = await prisma.transaction.findMany({
    where: {
      type: 'OUT',
      dailyClosingId: null,
      createdAt: { lt: startOfToday },
    },
  });

  if (orphaned.length === 0) {
    return { fechados: [], mensagem: 'Nenhuma venda pendente de fechamento encontrada.' };
  }

  // Agrupa por data BRT (cada dia recebe seu próprio fechamento)
  const byDay = new Map<string, typeof orphaned>();
  for (const sale of orphaned) {
    const day = getBRTDateString(sale.createdAt);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(sale);
  }

  const fechados: string[] = [];
  const products = await prisma.product.findMany();
  const finalStock = products.reduce((acc, p) => acc + p.currentStock, 0);

  for (const [day, sales] of byDay.entries()) {
    const totalSales = sales.reduce((acc, s) => acc + s.quantity, 0);
    const totalRevenue = sales.reduce((acc, s) => acc + (s.price || 0), 0);
    const pixTotal = sales.reduce((acc, s) => {
      if (s.paymentMethod === 'SPLIT') return acc + (s.pixPrice || 0);
      if (s.paymentMethod === 'PIX') return acc + (s.price || 0);
      return acc;
    }, 0);
    const cashTotal = sales.reduce((acc, s) => {
      if (s.paymentMethod === 'SPLIT') return acc + (s.cashPrice || 0);
      if (s.paymentMethod === 'CASH') return acc + (s.price || 0);
      return acc;
    }, 0);
    const cardTotal = sales.reduce((acc, s) => {
      if (s.paymentMethod === 'SPLIT') return acc + (s.cardPrice || 0);
      if (s.paymentMethod === 'CARD') return acc + (s.price || 0);
      return acc;
    }, 0);
    const clientTotal = sales.reduce((acc, s) => {
      if (s.paymentMethod === 'SPLIT') return acc + (s.clientPrice || 0);
      if (s.paymentMethod === 'CLIENT') return acc + (s.price || 0);
      return acc;
    }, 0);

    await prisma.$transaction(async (trx) => {
      const newClosing = await trx.dailyClosing.create({
        data: {
          date: startOfBRTDay(day),
          initialStock: 0,
          finalStock,
          totalSales,
          totalRevenue,
          pixTotal,
          cashTotal,
          cardTotal,
          clientTotal,
          isClosed: true,
        },
      });
      await trx.transaction.updateMany({
        where: { id: { in: sales.map((s) => s.id) } },
        data: { dailyClosingId: newClosing.id },
      });
    });

    fechados.push(day);
  }

  return {
    fechados,
    mensagem: `${fechados.length} fechamento(s) criado(s) automaticamente: ${fechados.join(', ')}`,
  };
}
