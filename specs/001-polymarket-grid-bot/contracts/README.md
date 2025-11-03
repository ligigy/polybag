# Contracts: Polymarket Grid Bot

文档目的：定义与外部/内部模块交互的数据契约，便于模拟与测试。

## Endpoints/Interfaces (Draft)
- MarketService (CLOB-backed via `@polymarket/clob-client`)
  - `listMarkets(): Promise<Market[]>` // 映射 `getMarkets/getSimplifiedMarkets`
  - `getOrderBook(tokenID: string): Promise<OrderBook>`
  - `createOrder(req: PlaceOrderRequest): Promise<ClobOrder>` // SDK 原始订单
  - `postOrder(order: ClobOrder, type: OrderType): Promise<Order>`
  - `postOrders(args: { order: ClobOrder; orderType: OrderType }[]): Promise<Order[]>`
  - `createAndPostOrder(req, marketCfg, orderType): Promise<Order>`
  - `createMarketOrder({ tokenID, amount, side, orderType }): Promise<ClobOrder>`
  - `cancelOrder({ orderId|clientOrderId }): Promise<void>`
  - `cancelAll(): Promise<void>` / `cancelMarketOrders({ market|asset_id }): Promise<void>`
  - `getOpenOrders(filter): Promise<Order[]>` / `getTrades(filter): Promise<TradeEvent[]>`
  - `getPricesHistory(filter): Promise<PricePoint[]>`
  - `getBalance(): Promise<Balance>`

- GridEngine
  - `buildLevels(cfg: GridConfig): GridLevel[]`
  - `onFill(event: TradeEvent): Action[]`  // 补挂/撤单/停机等动作

### ClobClientAdapter (proposed)
```ts
export interface ClobClientAdapter {
  init(cfg: { apiUrl?: string; apiKey?: string; privateKey?: string; rpcUrl?: string }): Promise<void>;
  listMarkets(): Promise<Market[]>;
  getOrderBook(tokenID: string): Promise<OrderBook>; // includes bids/asks + ts
  createOrder(req: PlaceOrderRequest & { idempotencyKey?: string }): Promise<any>;
  postOrder(order: any, orderType: OrderType): Promise<Order>;
  postOrders(args: { order: any; orderType: OrderType }[]): Promise<Order[]>;
  cancelOrder(orderId: string): Promise<void>;
  getBalance(): Promise<Balance>;
  getOpenOrders(filter: { market?: string; asset_id?: string }): Promise<Order[]>;
  getTrades(filter: { market?: string; asset_id?: string; maker_address?: string }, firstPageOnly?: boolean): Promise<TradeEvent[]>;
  getPricesHistory(filter: any): Promise<any>;
}
```

> 具体字段参见 `../data-model.md`；与 `@polymarket/clob-client` 的参数/返回值差异需要在 research 阶段补充映射与兼容层。

### WebSocket Feeds
- Market feed: `WS_URL/ws/market`
  - subscribe: `{ type: 'market', markets: string[], assets_ids: string[], initial_dump: boolean }`
  - messages: 订单簿/成交快照与增量，具体格式以 SDK 服务为准
- User feed: `WS_URL/ws/user`
  - subscribe: `{ type: 'user', auth: { apiKey, secret, passphrase }, markets: string[], initial_dump: boolean }`
  - messages: 用户订单与成交事件

### WalletBridge（前端签名桥）
```ts
export interface WalletBridge {
  requestAccounts(): Promise<`0x${string}`[]>;               // EIP-1102
  signTypedData<T extends object>(params: {
    domain: any; types: Record<string, any>; value: T;      // EIP-712
  }): Promise<`0x${string}`>;
  signMessage(msg: string | Uint8Array): Promise<`0x${string}`>;
  chainId(): Promise<number>;                               // 137 / 80002
}
```
实现建议：`wagmi/viem` 上封装或直接使用 `window.ethereum`（配合 EIP-6963 支持多注入钱包）。
