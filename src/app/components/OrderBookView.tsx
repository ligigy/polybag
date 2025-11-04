"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PolymarketWSClient from "@/services/polymarket/ws-client";
import { normalizeWsMarketToOrderBook } from "@/services/polymarket/normalize";

type Level = { price: number; size: number; count?: number };
type OrderBook = {
  marketId: string;
  bids: Level[];
  asks: Level[];
  ts: number;
  mid?: number;
  spread?: number;
};

export default function OrderBookView({ tokenID }: { tokenID: string }) {
  const [orderbook, setOrderbook] = React.useState<OrderBook | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const mode = "ws";

  React.useEffect(() => {
    let client: PolymarketWSClient | null = null;
    let closed = false;
    setLoading(true);
    setError(null);
    setOrderbook(null);

    const start = async () => {
      const envUrl = (process.env.NEXT_PUBLIC_WS_URL || "").trim();
      const base =
        envUrl.length > 0
          ? envUrl.replace(/\/$/, "")
          : "wss://ws-subscriptions-clob.polymarket.com/ws";
      const wsUrl = base.endsWith("/market") ? base : `${base}/market`;

      const wsClient = new PolymarketWSClient({
        url: wsUrl,
        autoReconnect: true,
        onMessage: (msg) => {
          if (closed) return;
          console.log('msg', msg);
          const ob = normalizeWsMarketToOrderBook(tokenID, msg);
          console.log('ob', ob);
          if (ob) {
            setOrderbook(ob);
            setLoading(false);
            setError(null);
          }
        },
        onError: (err) => {
          if (closed) return;
          const message =
            err instanceof Error ? err.message : String(err ?? "WS error");
          setError(message);
          setLoading(false);
        },
        onStatusChange: (status) => {
          if (closed) return;
          if (status === "closed") {
            setError((prev) => prev ?? "订单簿连接已关闭");
          }
        },
      });
      client = wsClient;

      try {
        await wsClient.connect();
        await wsClient.subscribeMarket({
          assets_ids: [tokenID],
          initial_dump: true,
        });
      } catch (err) {
        if (closed) return;
        const message =
          err instanceof Error ? err.message : String(err ?? "WS connect error");
        setError(message || "订单簿连接失败");
        setLoading(false);
      }
    };

    void start();

    return () => {
      closed = true;
      if (client) {
        client.close(true).catch(() => undefined);
      }
    };
  }, [tokenID]);

  const renderLevels = (levels: Level[] | undefined) => {
    if (!levels || levels.length === 0) return <div className="text-zinc-500">无数据</div>;
    return levels.slice(0, 20).map((lv, idx) => (
      <div
        key={idx}
        className="grid grid-cols-3 text-xs text-zinc-700 dark:text-zinc-200"
      >
        <span>{lv.price.toFixed(4)}</span>
        <span>{lv.size.toFixed(4)}</span>
        <span>{lv.count ?? "-"}</span>
      </div>
    ));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
        <span>
          更新时间：
          {orderbook?.ts ? new Date(orderbook.ts).toLocaleTimeString() : "-"}
        </span>
        {orderbook?.mid != null && (
          <span>
            中间价：
            {orderbook.mid.toFixed(4)}
          </span>
        )}
        {orderbook?.spread != null && (
          <span>
            点差：
            {orderbook.spread.toFixed(4)}
          </span>
        )}
        <span className="text-xs text-zinc-500">模式：{mode}</span>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bids (买)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="grid grid-cols-3 text-xs font-semibold text-zinc-500">
                <span>价格</span>
                <span>数量</span>
                <span>笔数</span>
              </div>
              <div className="max-h-64 overflow-auto space-y-1">
                {renderLevels(orderbook?.bids)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Asks (卖)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="grid grid-cols-3 text-xs font-semibold text-zinc-500">
                <span>价格</span>
                <span>数量</span>
                <span>笔数</span>
              </div>
              <div className="max-h-64 overflow-auto space-y-1">
                {renderLevels(orderbook?.asks)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
