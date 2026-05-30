import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { product: true }
    });

    if (!transaction) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });

    // Block deletion if already assigned to a daily closing
    if (transaction.dailyClosingId) {
       return NextResponse.json({ error: 'Esta venda já pertence a um caixa fechado e não pode ser alterada.' }, { status: 400 });
    }

    // Revert stock (Only OUT transaction is handled for edit/delete right now per user requirements "venda do dia")
    if (transaction.type === 'OUT') {
      let emptyStockChange = transaction.returnedEmpty !== false ? -transaction.quantity : 0;
      
      await prisma.$transaction(async (tx) => {
        // Restaura estoque
        await tx.product.update({
          where: { id: transaction.productId },
          data: {
            currentStock: { increment: transaction.quantity },
            emptyStock: { increment: emptyStockChange }
          }
        });

        // Deleta a transação
        await tx.transaction.delete({ where: { id } });
        
        // Se a transação tinha conta de cliente pendente atrelada e não estava paga? 
        // Pra simplificar na exclusão, como as transações da conta do cliente estão atreladas 
        // e somadas pelo saldo total on the fly ou pela customer update, precisamos ver se havia 
        // `customerId` que precisa estornar saldo.
        if (transaction.paymentMethod === 'CLIENT' && transaction.customerId && transaction.price) {
           await tx.customer.update({
             where: { id: transaction.customerId },
             data: { balance: { decrement: transaction.price } }
           });
        }
      });
    } else {
       return NextResponse.json({ error: 'Apenas vendas podem ser excluídas por aqui.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar transação' }, { status: 500 });
  }
}
