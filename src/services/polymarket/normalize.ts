// Polymarket message normalization utilities
// 原子化：仅负责将可能多形态的 WS/REST 数据，归一到本项目使用的订单簿结构
import { BookLevel, OrderBook } from "./types";

function toNumber(n: any, def = 0) {
  const v = typeof n === 'string' ? Number(n) : n;
  return Number.isFinite(v) ? Number(v) : def;
}

function mapLevels(arr: any): BookLevel[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((lv) => {
    if (Array.isArray(lv)) {
      // [price, size, count?]
      return { price: toNumber(lv[0]), size: toNumber(lv[1]), count: lv.length > 2 ? toNumber(lv[2]) : undefined };
    }
    // { price, size, count }
    return { price: toNumber(lv.price), size: toNumber(lv.size), count: lv.count != null ? toNumber(lv.count) : undefined };
  }).filter((lv) => lv.price > 0 && lv.size > 0);
}

// 将 WS 市场消息（可能是快照或增量）尽力归一为订单簿快照；
// 若无法归一，则返回 null（由调用方决定忽略或累计增量应用）。
export function normalizeWsMarketToOrderBook(tokenID: string, msg: any): OrderBook | null {
  const nowTs = Date.now();
  // 常见形态：{ bids: [...], asks: [...] }
  if (msg && (msg.bids || msg.asks)) {
    const bids = mapLevels(msg.bids || []);
    const asks = mapLevels(msg.asks || []);
    const bestBid = bids[0]?.price;
    const bestAsk = asks[0]?.price;
    const mid = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : undefined;
    const spread = bestBid && bestAsk ? (bestAsk - bestBid) : undefined;
    return {
      marketId: tokenID,
      bids,
      asks,
      ts: nowTs,
      mid,
      spread,
    };
  }
  // 包裹层：{ orderbook: { bids, asks } }
  if (msg && msg.orderbook && (msg.orderbook.bids || msg.orderbook.asks)) {
    const bids = mapLevels(msg.orderbook.bids || []);
    const asks = mapLevels(msg.orderbook.asks || []);
    const bestBid = bids[0]?.price;
    const bestAsk = asks[0]?.price;
    const mid = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : undefined;
    const spread = bestBid && bestAsk ? (bestAsk - bestBid) : undefined;
    return {
      marketId: tokenID,
      bids,
      asks,
      ts: nowTs,
      mid,
      spread,
    };
  }
  // 其它形态暂不支持：返回 null
  return null;
}
