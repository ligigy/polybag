import { NextRequest } from 'next/server';

const GAMMA_API = process.env.GAMMA_API_URL || 'https://gamma-api.polymarket.com';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) {
    return Response.json({ error: 'missing_slug' }, { status: 400 });
  }
  try {
    const r = await fetch(`${GAMMA_API}/events/slug/${encodeURIComponent(slug)}`, {
      headers: { 'accept': 'application/json' },
      // next: { revalidate: 30 }, // optionally enable ISR
    });
    const data = await r.json();
    // 直接返回原始结构
    return Response.json(data);
  } catch (e: any) {
    return Response.json({ error: e?.message || 'fetch_failed' });
  }
}

