'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PolymarketWSClient from '@/services/polymarket/ws-client';
import { normalizeWsMarketToOrderBook, applyPriceChanges } from '@/services/polymarket/normalize';

type Level = { price: number; size: number; count?: number };
type OrderBook = {
  marketId: string;
  bids: Level[];
  asks: Level[];
  ts: number;
  mid?: number;
  spread?: number;
};

export default function OrderBookView({
  tokenID,
  onOrderBookUpdate,
}: {
  tokenID: string;
  onOrderBookUpdate?: (orderbook: OrderBook | null) => void;
}) {
  const [orderbook, setOrderbook] = React.useState<OrderBook | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // 当 orderbook 更新时，通知父组件
  React.useEffect(() => {
    onOrderBookUpdate?.(orderbook);
  }, [orderbook, onOrderBookUpdate]);

  React.useEffect(() => {
    let client: PolymarketWSClient | null = null;
    let closed = false;
    setLoading(true);
    setError(null);
    setOrderbook(null);

    const start = async () => {
      const envUrl = (process.env.NEXT_PUBLIC_WS_URL || '').trim();
      const base =
        envUrl.length > 0
          ? envUrl.replace(/\/$/, '')
          : 'wss://ws-subscriptions-clob.polymarket.com/ws';
      const wsUrl = base.endsWith('/market') ? base : `${base}/market`;

      const wsClient = new PolymarketWSClient({
        url: wsUrl,
        autoReconnect: true,
        onMessage: (msg) => {
          if (closed) return;
          // console.log('msg', msg);

          // 先尝试作为完整订单簿快照处理
          const fullBook = normalizeWsMarketToOrderBook(tokenID, msg);
          if (fullBook) {
            // console.log('Full book snapshot:', fullBook);
            setOrderbook(fullBook);
            setLoading(false);
            setError(null);
            return;
          }

          // 如果不是完整快照，尝试作为增量更新处理
          setOrderbook((currentBook) => {
            const updatedBook = applyPriceChanges(currentBook, tokenID, msg);
            if (updatedBook && updatedBook !== currentBook) {
              // console.log('Applied price changes:', updatedBook);
              setError(null);
            }
            return updatedBook;
          });
        },
        onError: (err) => {
          if (closed) return;
          const message = err instanceof Error ? err.message : String(err ?? 'WS error');
          setError(message);
          setLoading(false);
        },
        onStatusChange: (status) => {
          if (closed) return;
          if (status === 'closed') {
            setError((prev) => prev ?? '订单簿连接已关闭');
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
        const message = err instanceof Error ? err.message : String(err ?? 'WS connect error');
        setError(message || '订单簿连接失败');
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

  const formatPriceCents = (price: number | null | undefined) => {
    if (price == null || Number.isNaN(price)) return '-';
    const cents = price * 100;
    const rounded = Math.round(cents * 100) / 100;
    const hasFraction = Math.abs(rounded - Math.round(rounded)) > 1e-8;
    return `${new Intl.NumberFormat(undefined, {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(rounded)}¢`;
  };

  const formatShares = (size: number) => Math.abs(size).toFixed(2);

  const formatTotalDollar = (totalDollar: number) => {
    const rounded = Math.round(totalDollar * 100) / 100;
    const hasFraction = Math.abs(rounded - Math.round(rounded)) > 1e-8;
    return `$${new Intl.NumberFormat(undefined, {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(rounded)}`;
  };

  // 计算带累计值的订单簿数据
  const calculateCumulativeLevels = (levels: Level[], reverse = false) => {
    let cumulative = 0;
    const result = levels.map((lvl) => {
      const total = Math.abs(lvl.size) * lvl.price;
      cumulative += total;
      return { ...lvl, cumulative };
    });
    return reverse ? result.reverse() : result;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
        <span>
          更新时间：
          {orderbook?.ts ? new Date(orderbook.ts).toLocaleTimeString() : '-'}
        </span>
        {orderbook?.mid != null && (
          <span>
            中间价 Mid：
            {formatPriceCents(orderbook.mid)}
          </span>
        )}
        {orderbook?.spread != null && (
          <span>
            点差 Spread：
            {formatPriceCents(orderbook.spread)}
          </span>
        )}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Card>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-3 text-xs font-semibold text-zinc-500">
              <span className="text-left">价格 Price</span>
              <span className="text-right">份额 Shares</span>
              <span className="text-right">价值 Total</span>
            </div>
            <div className="max-h-72 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
              <div className="max-h-72 overflow-auto">
                <div className="space-y-2 p-2">
                  <div className="text-[11px] font-medium text-zinc-400">卖盘</div>
                  {orderbook?.asks && orderbook.asks.length > 0 ? (
                    (() => {
                      const asksToShow = orderbook.asks.slice(0, 20);
                      const cumulativeLevels = calculateCumulativeLevels(asksToShow, true);
                      return cumulativeLevels.map((lvl, idx) => (
                        <div key={`ask-${idx}`} className="grid grid-cols-3 items-center text-xs">
                          <span className="text-rose-500">{formatPriceCents(lvl.price)}</span>
                          <span className="text-right text-rose-500">{formatShares(lvl.size)}</span>
                          <span className="text-right text-rose-400">
                            {formatTotalDollar(lvl.cumulative)}
                          </span>
                        </div>
                      ));
                    })()
                  ) : (
                    <div className="py-6 text-center text-xs text-zinc-500">卖盘暂无数据</div>
                  )}
                  <div className="border-t border-dashed border-zinc-200 pt-2 dark:border-zinc-700" />
                  <div className="text-[11px] font-medium text-zinc-400">买盘</div>
                  {orderbook?.bids && orderbook.bids.length > 0 ? (
                    (() => {
                      const bidsToShow = orderbook.bids.slice(0, 20);
                      const cumulativeLevels = calculateCumulativeLevels(bidsToShow, false);
                      return cumulativeLevels.map((lvl, idx) => (
                        <div key={`bid-${idx}`} className="grid grid-cols-3 items-center text-xs">
                          <span className="text-emerald-500">{formatPriceCents(lvl.price)}</span>
                          <span className="text-right text-emerald-500">
                            {formatShares(lvl.size)}
                          </span>
                          <span className="text-right text-emerald-400">
                            {formatTotalDollar(lvl.cumulative)}
                          </span>
                        </div>
                      ));
                    })()
                  ) : (
                    <div className="py-6 text-center text-xs text-zinc-500">买盘暂无数据</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
