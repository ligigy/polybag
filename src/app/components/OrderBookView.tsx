"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

type Level = { price: number; size: number; count?: number };
type OrderBook = { marketId: string; bids: Level[]; asks: Level[]; ts: number; mid?: number; spread?: number };

export default function OrderBookView({ tokenID }: { tokenID: string }) {
  const [ob, setOb] = React.useState<OrderBook | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let es: EventSource | null = null;
    setErr(null);
    setOb(null);
    try {
      es = new EventSource(`/api/markets?sse=1&stream=ws&tokenID=${encodeURIComponent(tokenID)}`);
      es.addEventListener('orderbook', (ev) => {
        try {
          const data = JSON.parse((ev as MessageEvent).data);
          if (data?.orderbook) setOb(data.orderbook as OrderBook);
        } catch {}
      });
      es.addEventListener('market', (ev) => {
        // 可以在此解析 WS 推送的市场消息，自行组装 ob（TODO：依据服务端消息结构细化）
      });
      es.addEventListener('error', (ev) => {
        setErr('SSE 错误');
      });
    } catch (e: any) {
      setErr(e?.message || '无法连接 SSE');
    }
    return () => { if (es) es.close(); };
  }, [tokenID]);

  return (
    <div className="w-full space-y-3">
      <div className="text-sm text-zinc-600">
        <span>更新时间：{ob?.ts ? new Date(ob.ts).toLocaleTimeString() : '-'}</span>
        {ob?.mid != null && (<>
          <span className="mx-3">中间价：{ob.mid.toFixed(4)}</span>
          {ob?.spread != null && <span>点差：{ob.spread.toFixed(4)}</span>}
        </>)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Bids</CardTitle></CardHeader>
          <CardContent>
            <div className="text-xs max-h-64 overflow-auto">
              {ob?.bids?.slice(0, 20).map((l, i) => (
                <div key={`b-${i}`} className="flex justify-between"><span>{l.price}</span><span>{l.size}</span></div>
              )) || <div className="text-zinc-500">无</div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Asks</CardTitle></CardHeader>
          <CardContent>
            <div className="text-xs max-h-64 overflow-auto">
              {ob?.asks?.slice(0, 20).map((l, i) => (
                <div key={`a-${i}`} className="flex justify-between"><span>{l.price}</span><span>{l.size}</span></div>
              )) || <div className="text-zinc-500">无</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
