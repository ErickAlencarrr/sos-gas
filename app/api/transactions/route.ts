import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { productId, type, quantity, invoiceNumber, hasBoleto, isBoletoPaid, boletoAmount, boletoDueDate, price, paymentMethod } = body;

    if (!productId || !type || !quantity) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    if (type === 'IN' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas a Diretoria pode registrar entrada de estoque.' }, { status: 403 });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      // Cria a transação
      const newTx = await tx.transaction.create({
        data: {
          productId,
          type,
          quantity: parseInt(quantity),
          invoiceNumber: invoiceNumber || null,
          hasBoleto: hasBoleto || false,
          isBoletoPaid: isBoletoPaid || false,
          price: price ? parseFloat(price) : null,
          paymentMethod: paymentMethod || null,
        },
        include: { product: true }
      });

      // Atualiza o estoque
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: {
            [type === 'IN' ? 'increment' : 'decrement']: parseInt(quantity),
          },
        },
      });

      // Se tiver boleto, cria a Conta a Pagar automaticamente
      if (type === 'IN' && hasBoleto && boletoDueDate) {
         await tx.bill.create({
           data: {
             title: `NF ${invoiceNumber || 'S/N'} - Carga ${newTx.product.name}`,
             amount: boletoAmount ? parseFloat(boletoAmount) : null,
             dueDate: new Date(boletoDueDate + "T12:00:00Z"), // Ajuste de fuso horário
             isPaid: isBoletoPaid || false,
             transactionId: newTx.id
           }
         });
      }

      return { newTx, product };
    });

    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao registrar transação' }, { status: 500 });
  }
}
