import { NextRequest } from 'next/server';
import { hasRunner, registerRunner, stopRunner } from '@/worker/registry';
import { startGridRunner } from '@/worker/gridRunner';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    if (hasRunner(id)) {
      return Response.json({ ok: true, alreadyRunning: true });
    }
    const timer = await startGridRunner(id);
    registerRunner(id, timer);
    return Response.json({ ok: true });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || '启动失败' }), { status: 500 });
  }
}
