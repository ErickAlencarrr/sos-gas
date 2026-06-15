import { NextResponse } from 'next/server';
import { closeOrphanedDays } from '@/lib/auto-closing';

// Chamado pela Vercel às 03:00 UTC (meia-noite horário de Brasília)
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const result = await closeOrphanedDays();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[cron/auto-closing]', error);
    return NextResponse.json({ error: 'Erro ao fechar caixa automaticamente' }, { status: 500 });
  }
}
