import { NextResponse } from 'next/server';
import { getSessionOrBearer } from '@/lib/getSessionOrBearer';
import { closeOrphanedDays } from '@/lib/auto-closing';

// Endpoint manual para a diretoria recuperar fechamentos de dias esquecidos
export async function POST(req: Request) {
  const session = await getSessionOrBearer(req);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Apenas a Diretoria pode executar esta ação.' }, { status: 403 });
  }

  try {
    const result = await closeOrphanedDays();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[admin/fix-orphaned]', error);
    return NextResponse.json({ error: 'Erro ao recuperar fechamentos.' }, { status: 500 });
  }
}
