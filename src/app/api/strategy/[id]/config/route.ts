import { NextRequest } from 'next/server';
import { readJson, writeJson } from '@/lib/persistence/fsState';

type Outcome = 'YES' | 'NO';

export interface GridConfig {
  marketId: string;
  outcome: Outcome;
  priceMin: number;
  priceMax: number;
  step: number;
  sizePerLevel: number;
  budget: number;
  orderType?: 'GTC' | 'GTD' | 'FAK' | 'FOK';
  postOnly?: boolean;
  refillMode: 'ALWAYS' | 'ON_FILL' | 'NEVER';
  risk?: Record<string, unknown>;
  mode?: 'LIVE' | 'PAPER' | 'BACKTEST';
  tokenID?: string;
  ttlSeconds?: number;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cfg = await readJson<GridConfig | null>(`strategies/${id}/config.json`, null);
  if (!cfg) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return Response.json({ id, config: cfg });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { config: GridConfig };
  if (!body?.config)
    return new Response(JSON.stringify({ error: 'Missing config' }), { status: 400 });

  // Basic validation
  const c = body.config;
  if (!c.marketId || !c.outcome)
    return new Response(JSON.stringify({ error: 'marketId/outcome required' }), { status: 400 });
  if (!(c.priceMax > c.priceMin) || !(c.step > 0))
    return new Response(JSON.stringify({ error: 'invalid range/step' }), { status: 400 });
  if (c.orderType === 'GTD' && (!c.ttlSeconds || c.ttlSeconds < 10)) {
    return new Response(JSON.stringify({ error: 'ttlSeconds must be >= 10 for GTD' }), {
      status: 400,
    });
  }

  await writeJson(`strategies/${id}/config.json`, c);
  return Response.json({ ok: true, id });
}
