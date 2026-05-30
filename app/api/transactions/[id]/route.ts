import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

    const body = await req.json();
    const { productId, quantity, price, paymentMethod, splitValues, returnedEmpty, customerId } = body;

    const oldTx = await prisma.transaction.findUnique({ where: { id } });
    if (!oldTx) return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    if (oldTx.dailyClosingId) return NextResponse.json({ error: 'Esta venda já pertence a um caixa fechado e não pode ser alterada.' }, { status: 400 });

    if (oldTx.type !== 'OUT') {
      return NextResponse.json({ error: 'Apenas vendas podem ser editadas por aqui.' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. REVERTER A TRANSAÇÃO ANTIGA
      let oldEmptyStockChange = oldTx.returnedEmpty !== false ? -oldTx.quantity : 0;
      await tx.product.update({
        where: { id: oldTx.productId },
        data: {
          currentStock: { increment: oldTx.quantity },
          emptyStock: { increment: oldEmptyStockChange }
        }
      });
      
      if (oldTx.customerId) {
        const oldClientValue = oldTx.paymentMethod === 'SPLIT' ? (oldTx.clientPrice || 0) : (oldTx.paymentMethod === 'CLIENT' ? (oldTx.price || 0) : 0);
        if (oldClientValue > 0) {
          await tx.customer.update({
            where: { id: oldTx.customerId },
            data: { balance: { decrement: oldClientValue } }
          });
        }
      }

      // 2. APLICAR OS NOVOS VALORES E ATUALIZAR
      let newEmptyStockChange = returnedEmpty !== false ? parseInt(quantity) : 0;
      await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: { decrement: parseInt(quantity) },
          emptyStock: { increment: newEmptyStockChange }
        }
      });

      const newClientValue = paymentMethod === 'SPLIT' ? parseFloat(splitValues?.client || "0") : (paymentMethod === 'CLIENT' ? parseFloat(price) : 0);
      if (customerId && newClientValue > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: { balance: { increment: newClientValue } }
        });
      }

      // 3. ATUALIZAR O REGISTRO DA TRANSAÇÃO
      await tx.transaction.update({
        where: { id },
        data: {
          productId,
          quantity: parseInt(quantity),
          price: parseFloat(price),
          paymentMethod: paymentMethod === 'SPLIT' ? 'SPLIT' : paymentMethod,
          cashPrice: paymentMethod === 'SPLIT' ? parseFloat(splitValues?.cash || "0") : 0,
          pixPrice: paymentMethod === 'SPLIT' ? parseFloat(splitValues?.pix || "0") : 0,
          cardPrice: paymentMethod === 'SPLIT' ? parseFloat(splitValues?.card || "0") : 0,
          clientPrice: newClientValue,
          returnedEmpty,
          customerId: customerId || null
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar a transação' }, { status: 500 });
  }
}

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
