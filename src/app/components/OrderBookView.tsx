"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [mode, setMode] = React.useState<"ws" | "poll">("ws");

  React.useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;
    setLoading(true);
    setError(null);
    setOrderbook(null);

    const startStream = (nextMode: "ws" | "poll") => {
      if (closed) return;
      if (es) es.close();
      setMode(nextMode);
      const url = `/api/markets/stream?mode=${nextMode}&tokenID=${encodeURIComponent(
        tokenID
      )}`;
      es = new EventSource(url);
      es.addEventListener("orderbook", (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data);
          if (data?.orderbook) {
            setOrderbook(data.orderbook as OrderBook);
            setLoading(false);
          }
        } catch (err) {
          console.error(err);
        }
      });
      es.addEventListener("error", () => {
        setError("订单簿连接异常，正在回退...");
        if (nextMode === "ws") {
          startStream("poll");
        }
      });
    };

    startStream("ws");

    return () => {
      closed = true;
      if (es) es.close();
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
