# Data Model: Polymarket 自动化网格交易平台（对齐 @polymarket/clob-client）

```ts
// ===== Common Enums =====
export type Outcome = 'YES' | 'NO';
export type TradeSide = 'BUY' | 'SELL';
export type MarketStatus = 'TRADING' | 'SETTLING' | 'CLOSED';
// TIF 以 CLOB 为准，具体取值待校验
// 与 SDK 的 OrderType 对齐：限价(GTC/GTD)、市价(FAK/FOK)
export type OrderType = 'GTC' | 'GTD' | 'FAK' | 'FOK';

// ===== Market & OrderBook =====
export interface Market {
  id: string;                 // 对应 CLOB/Polymarket 市场唯一标识
  slug?: string;              // 可读标识（若有）
  question?: string;          // 市场描述（若有）
  outcomes: Outcome[];        // 通常为 ['YES','NO']
  tickSize: number;           // 最小变动价位（对齐 CLOB）
  minPrice?: number;          // 一般为 0
  maxPrice?: number;          // 一般为 1
  minSize?: number;           // 最小下单数量（SDK 若提供）
  feeBps: number;             // 费用基点（撮合+结算）
  status: MarketStatus;
  clobSymbol?: string;        // 若 CLOB 使用 symbol 访问
  conditionId?: string;       // 条件市场 ID（WS 订阅使用）
  tokenIdYes?: string;        // YES 资产 tokenID
  tokenIdNo?: string;         // NO 资产 tokenID
}

export interface BookLevel { price: number; size: number; count?: number }
export interface OrderBook {
  marketId: string;
  bids: BookLevel[];          // 价格降序
  asks: BookLevel[];          // 价格升序
  ts: number;                 // 快照/更新时间戳（ms）
}

// ===== Strategy Configuration =====
export interface GridConfig {
  marketId: string;
  outcome: Outcome;           // 策略主方向
  priceMin: number;
  priceMax: number;
  step: number;               // 网格步长
  sizePerLevel: number;       // 每格下单数量（以 outcome 计价）
  budget: number;             // 资金上限（USDC）
  orderType?: OrderType;      // 默认 GTC；GTD 需带 expiration
  postOnly?: boolean;         // 若支持被动单
  refillMode: 'ALWAYS' | 'ON_FILL' | 'NEVER';
  risk: RiskParams;
  mode: 'LIVE' | 'PAPER' | 'BACKTEST';
}

export interface RiskParams {
  maxExposure?: number;       // 最大头寸（outcome 数量）
  maxCapital?: number;        // 最大资金占用（USDC）
  dailyLossLimit?: number;    // 当日亏损阈值（USDC）
  stopLoss?: number;          // 止损价格
  takeProfit?: number;        // 止盈价格
  cooldownSec?: number;       // 冷却时间
}

// ===== Orders & Placement =====
export type OrderStatus =
  | 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface Order {
  id: string;                 // CLOB 返回的订单 ID
  clientOrderId?: string;     // 客户端自定义 ID（便于幂等等）
  marketId: string;
  outcome: Outcome;
  side: TradeSide;            // BUY=买入 outcome，SELL=卖出 outcome
  price: number;
  size: number;               // 下单数量（以 outcome 计）
  filled: number;             // 已成交数量
  status: OrderStatus;
  orderType: OrderType;
  postOnly?: boolean;
  reduceOnly?: boolean;       // 若 CLOB 支持
  tokenID?: string;           // 直接使用资产 ID 下单（SDK 常用）
  expiration?: number;        // Unix秒，用于 GTD（需 >= now+10s）
  levelPrice?: number;        // 映射到 GridLevel 价格层
  createdAt: number;
  updatedAt: number;
}

export interface PlaceOrderRequest {
  marketId?: string;          // 二选一：使用 marketId+outcome 或直接 tokenID
  outcome?: Outcome;
  tokenID?: string;
  side: TradeSide;
  price?: number;             // 限价单
  size?: number;              // 限价数量（outcome 数量）
  amount?: number;            // 市价下单的 USDC 金额（createMarketOrder）
  orderType?: OrderType;      // GTC/GTD/FAK/FOK
  postOnly?: boolean;
  reduceOnly?: boolean;
  expiration?: number;        // GTD 需要
  idempotencyKey?: string;    // 幂等键，防止重复下单
  clientOrderId?: string;     // 自定义客户端 ID
}

export interface CancelOrderRequest {
  orderId?: string;
  clientOrderId?: string;     // 二选一
}

// ===== Grid Levels =====
export interface GridLevel {
  price: number;
  targetQty: number;
  openOrderIds: string[];
  lastFillTs?: number;
}

// ===== Portfolio & Metrics =====
export interface Position {
  outcome: Outcome;
  qty: number;                // outcome 数量
  avgPrice: number;
  unrealizedPnl: number;      // USDC
  realizedPnl: number;        // USDC
}

export interface Balance {
  usdc: number;
  allowance?: number;         // USDC allowance（链上）
  outcomeYes?: number;        // 账户 YES 头寸（若可见）
  outcomeNo?: number;         // 账户 NO 头寸（若可见）
}

export interface TradeEvent {
  tradeId?: string;           // 若 CLOB 提供
  orderId: string;
  price: number;
  size: number;
  liquidity?: 'MAKER' | 'TAKER';
  feePaid?: number;           // USDC，若提供
  ts: number;
}

// ===== Streaming / Frontend SSE Payloads =====
export interface OrderBookUpdate {
  marketId: string;
  bids: BookLevel[];
  asks: BookLevel[];
  ts: number;
}

export interface FillUpdate {
  marketId: string;
  event: TradeEvent;
}

// ===== Strategy State =====
export interface StrategyState {
  config: GridConfig;
  levels: GridLevel[];
  openOrders: Record<string, Order>;
  position: Position;
  balance: Balance;
  metrics: RuntimeMetrics;
}

export interface RuntimeMetrics {
  fills: number;
  cancels: number;
  errors: number;
  lastHeartbeat: number;
}
```

对齐说明：
- 以上字段命名与含义以 `@polymarket/clob-client` 为主；确切取值（尤其是 TIF、订单状态、订单簿结构）需在 Research 阶段与 SDK 文档逐项核对并更新。
- 网格引擎与适配层之间仅依赖本数据模型；适配层负责完成与 SDK 的字段映射与单位换算，并实现幂等与重试策略。
