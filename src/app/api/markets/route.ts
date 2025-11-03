import { NextRequest } from 'next/server';
import PolymarketClobAdapter from '@/services/polymarket/clob-adapter';

interface MarketData {
  clobTokenIds?: string | string[];
  clob_token_ids?: string | string[];
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tokenID = searchParams.get("tokenID") || undefined;
  const slug = searchParams.get("slug") || undefined;
  const closed = searchParams.get("closed") === "true";

  const adapter = new PolymarketClobAdapter();
  try {
    await adapter.init();
    if (tokenID) {
      const orderbook = await adapter.getOrderBook(tokenID);
      return Response.json({ orderbook });
    }
    // 事件模式：当提供 slug 时，通过 Gamma API 获取该事件的 markets
    if (slug) {
      const GAMMA_API = process.env.GAMMA_API_URL || 'https://gamma-api.polymarket.com';
      // 使用 slug 参数直接过滤特定事件的市场（slug 为数组参数）
      const url = `${GAMMA_API}/markets?slug=${encodeURIComponent(slug)}&closed=${closed}&limit=1000`;
      const r = await fetch(url, { headers: { accept: 'application/json' } });
      const data: unknown = await r.json();
      const arr: MarketData[] = Array.isArray(data) ? data : (Array.isArray((data as { data?: unknown })?.data) ? (data as { data: MarketData[] }).data : []);
      
      // 仅过滤有效市场：clobTokenIds 存在且至少包含 2 个 token
      const hasTwoTokens = (m: MarketData) => {
        const c = (m.clobTokenIds || m.clob_token_ids);
        try {
          const arr = Array.isArray(c) ? c : JSON.parse(c || '[]');
          return Array.isArray(arr) && arr.length >= 2;
        } catch { return false; }
      };
      const filtered = arr.filter(hasTwoTokens);
      return Response.json({ 
        data: filtered, 
        next_cursor: (data as { next_cursor?: string | null })?.next_cursor || null, 
        limit: (data as { limit?: number })?.limit || filtered.length, 
        count: filtered.length 
      });
    }
    // 默认返回空结构（避免全量列表）
    return Response.json({ data: [], next_cursor: null, limit: 0, count: 0 });
  } catch (err) {
    const error = err as Error;
    console.log('Error in /api/markets:', error);
    return Response.json({ data: [], next_cursor: null, limit: 0, count: 0, error: error?.message || 'adapter_unavailable' });
  }
}
