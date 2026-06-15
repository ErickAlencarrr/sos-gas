import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { closeOrphanedDays } from '@/lib/auto-closing';

// Endpoint manual para a diretoria recuperar fechamentos de dias esquecidos
export async function POST() {
  const session = await getServerSession(authOptions);
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
