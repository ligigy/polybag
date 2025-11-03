// Polymarket 数据契约类型定义
// 与 specs/001-polymarket-grid-bot/data-model.md 对齐，供服务层与前端复用。

export type Outcome = "YES" | "NO";
export type TradeSide = "BUY" | "SELL";
export type MarketStatus = "TRADING" | "SETTLING" | "CLOSED";
export type OrderType = "GTC" | "GTD" | "FAK" | "FOK";

export interface Market {
  id: string;
  slug?: string;
  question?: string;
  outcomes: Outcome[];
  tickSize: number;
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  feeBps: number;
  status: MarketStatus;
  clobSymbol?: string;
  conditionId?: string;
  tokenIdYes?: string;
  tokenIdNo?: string;
}

export interface BookLevel {
  price: number;
  size: number;
  count?: number;
}

export interface OrderBook {
  marketId: string;
  bids: BookLevel[];
  asks: BookLevel[];
  ts: number;
  mid?: number;
  spread?: number;
}

export interface GridConfig {
  marketId: string;
  outcome: Outcome;
  priceMin: number;
  priceMax: number;
  step: number;
  sizePerLevel: number;
  budget: number;
  orderType?: OrderType;
  postOnly?: boolean;
  refillMode: "ALWAYS" | "ON_FILL" | "NEVER";
  tokenID?: string;
  ttlSeconds?: number;
  risk?: RiskParams;
  mode: "LIVE" | "PAPER" | "BACKTEST";
}

export interface RiskParams {
  maxExposure?: number;
  maxCapital?: number;
  dailyLossLimit?: number;
  stopLoss?: number;
  takeProfit?: number;
  cooldownSec?: number;
}

export type OrderStatus =
  | "OPEN"
  | "PARTIAL"
  | "FILLED"
  | "CANCELLED"
  | "REJECTED";

export interface Order {
  id: string;
  clientOrderId?: string;
  marketId: string;
  outcome: Outcome;
  side: TradeSide;
  price: number;
  size: number;
  filled: number;
  status: OrderStatus;
  orderType: OrderType;
  postOnly?: boolean;
  reduceOnly?: boolean;
  tokenID?: string;
  expiration?: number;
  levelPrice?: number;
  createdAt: number;
  updatedAt: number;
}

export interface PlaceOrderRequest {
  marketId?: string;
  outcome?: Outcome;
  tokenID?: string;
  side: TradeSide;
  price?: number;
  size?: number;
  amount?: number;
  orderType?: OrderType;
  postOnly?: boolean;
  reduceOnly?: boolean;
  expiration?: number;
  idempotencyKey?: string;
  clientOrderId?: string;
}

export interface CancelOrderRequest {
  orderId?: string;
  clientOrderId?: string;
}

export interface Balance {
  usdc: number;
  allowance?: number;
  outcomeYes?: number;
  outcomeNo?: number;
}

export interface TradeEvent {
  tradeId?: string;
  orderId: string;
  price: number;
  size: number;
  liquidity?: "MAKER" | "TAKER";
  feePaid?: number;
  ts: number;
}

export interface StrategyState {
  config: GridConfig;
  levels: GridLevel[];
  openOrders: Record<string, Order>;
  position: Position;
  balance: Balance;
  metrics: RuntimeMetrics;
}

export interface GridLevel {
  price: number;
  targetQty: number;
  openOrderIds: string[];
  lastFillTs?: number;
}

export interface Position {
  outcome: Outcome;
  qty: number;
  avgPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
}

export interface RuntimeMetrics {
  fills: number;
  cancels: number;
  errors: number;
  lastHeartbeat: number;
}
