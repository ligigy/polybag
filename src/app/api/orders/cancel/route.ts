import { NextRequest } from 'next/server';
import PolymarketClobAdapter from '@/services/polymarket/clob-adapter';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { orderId?: string } | null;
  if (!body?.orderId) return new Response(JSON.stringify({ error: 'orderId required' }), { status: 400 });
  const adapter = new PolymarketClobAdapter();
  try {
    await adapter.init();
    await adapter.cancelOrder(body.orderId);
    return Response.json({ ok: true });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Cancel failed' }), { status: 400 });
  }
}

