import { NextRequest } from 'next/server';
import { stopRunner } from '@/worker/registry';
import { stopGridRunner } from '@/worker/gridRunner';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    stopRunner(id);
    await stopGridRunner(id);
    return Response.json({ ok: true });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || '停止失败' }), { status: 500 });
  }
}

