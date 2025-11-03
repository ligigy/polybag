import { NextRequest } from 'next/server';
import PolymarketClobAdapter, { OrderType, PlaceOrderRequest } from '@/services/polymarket/clob-adapter';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as (PlaceOrderRequest & { orderType?: OrderType }) | null;
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  const adapter = new PolymarketClobAdapter();
  try {
    await adapter.init();
    const created = await adapter.createOrder(body);
    const posted = await adapter.postOrder(created, body.orderType || 'GTC');
    return Response.json({ order: posted });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Order failed' }), { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const market = searchParams.get('market') || undefined;
  const asset_id = searchParams.get('asset_id') || undefined;
  const adapter = new PolymarketClobAdapter();
  try {
    await adapter.init();
    const orders = await adapter.getOpenOrders({ market, asset_id });
    return Response.json({ orders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Query failed' }), { status: 400 });
  }
}

