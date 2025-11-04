// Polymarket message normalization utilities
// 原子化：仅负责将可能多形态的 WS/REST 数据，归一到本项目使用的订单簿结构
import { BookLevel, OrderBook } from "./types";

function toNumber(n: any, def = 0) {
  const v = typeof n === "string" ? Number(n) : n;
  return Number.isFinite(v) ? Number(v) : def;
}

function mapLevels(arr: any): BookLevel[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((lv) => {
      if (Array.isArray(lv)) {
        // [price, size, count?]
        return {
          price: toNumber(lv[0]),
          size: toNumber(lv[1]),
          count: lv.length > 2 ? toNumber(lv[2]) : undefined,
        };
      }
      // { price, size, count }
      return {
        price: toNumber(lv.price),
        size: toNumber(lv.size),
        count: lv.count != null ? toNumber(lv.count) : undefined,
      };
    })
    .filter((lv) => lv.price > 0 && lv.size > 0);
}

function sortLevels(levels: BookLevel[], desc = false): BookLevel[] {
  if (levels.length <= 1) return levels;
  return [...levels].sort((a, b) =>
    desc ? b.price - a.price : a.price - b.price
  );
}

function normalizeTimestamp(input: unknown): number {
  const num = typeof input === "string" ? Number(input) : Number(input);
  if (!Number.isFinite(num) || num <= 0) return Date.now();
  // If looks like seconds (10 digits) convert to ms
  if (num < 1e12) return num * 1000;
  return num;
}

function flattenPayload(raw: any): any {
  if (!raw || typeof raw !== "object") return raw;

  let result = { ...raw };
  const nestedKeys = ["data", "payload", "message"];
  for (const key of nestedKeys) {
    const value = result[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result = { ...value, ...result, ...flattenPayload(value) };
    }
  }
  if (result.orderbook && typeof result.orderbook === "object") {
    result = { ...result, ...flattenPayload(result.orderbook) };
  }
  return result;
}

// 将 WS 市场消息（可能是快照或增量）尽力归一为订单簿快照；
// 若无法归一，则返回 null（由调用方决定忽略或累计增量应用）。
export function normalizeWsMarketToOrderBook(
  tokenID: string,
  msg: any
): OrderBook | null {
  const candidates = Array.isArray(msg) ? msg : [msg];

  for (const raw of candidates) {
    if (!raw) continue;
    const flattened = flattenPayload(raw);
    if (!flattened) continue;

    // 只处理 book 类型的消息（完整订单簿快照）
    if (
      flattened.event_type &&
      typeof flattened.event_type === "string" &&
      flattened.event_type.toLowerCase() !== "book"
    ) {
      continue;
    }

    // asset_id/market 校验（若存在）
    if (
      flattened.asset_id &&
      tokenID &&
      String(flattened.asset_id) !== String(tokenID)
    ) {
      continue;
    }

    const source = flattened.orderbook || flattened;
    const bids = mapLevels(source.bids || source.buy || []);
    const asks = mapLevels(source.asks || source.sell || []);

    if (bids.length === 0 && asks.length === 0) {
      continue;
    }

    const sortedBids = sortLevels(bids, true);
    const sortedAsks = sortLevels(asks, false);
    const bestBid = sortedBids[0]?.price;
    const bestAsk = sortedAsks[0]?.price;
    const mid =
      typeof bestBid === "number" && typeof bestAsk === "number"
        ? (bestBid + bestAsk) / 2
        : undefined;
    const spread =
      typeof bestBid === "number" && typeof bestAsk === "number"
        ? bestAsk - bestBid
        : undefined;

    const tsSource =
      flattened.timestamp ??
      flattened.ts ??
      flattened.time ??
      flattened.last_update;

    return {
      marketId: tokenID,
      bids: sortedBids,
      asks: sortedAsks,
      ts: normalizeTimestamp(tsSource),
      mid,
      spread,
    };
  }

  // 其它形态暂不支持：返回 null
  return null;
}
