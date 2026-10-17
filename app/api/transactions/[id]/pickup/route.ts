import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionOrBearer } from '@/lib/getSessionOrBearer';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionOrBearer(req);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await context.params;

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUniqueOrThrow({ where: { id } });
      if (!existing.isPendingPickup) return existing;

      const tx2 = await tx.transaction.update({
        where: { id },
        data: { isPendingPickup: false, pickedUpAt: new Date() },
      });

      // Só agora o produto sai de fato da loja: baixa estoque.
      const emptyStockChange = existing.returnedEmpty !== false ? existing.quantity : 0;
      await tx.product.update({
        where: { id: existing.productId },
        data: {
          currentStock: { decrement: existing.quantity },
          emptyStock: { increment: emptyStockChange },
        },
      });

      return tx2;
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao confirmar retirada' }, { status: 500 });
  }
}
