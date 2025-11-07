// Polymarket CLOB adapter：封装 SDK 并输出统一类型
import {
  ClobClient,
  OrderType as SDKOrderType,
  Side as SDKSide,
  AssetType,
} from '@polymarket/clob-client';
import {
  Balance,
  BookLevel,
  Market,
  MarketStatus,
  Order,
  OrderStatus,
  OrderBook,
  OrderType,
  Outcome,
  PlaceOrderRequest,
  TradeEvent,
  TradeSide,
} from './types';

export type AdapterInitConfig = {
  apiUrl?: string;
  wsUrl?: string;
  chainId?: number;
};

export type ResolvedAdapterConfig = {
  apiUrl: string;
  wsUrl: string;
  chainId: number;
};

export type ApiCredentials = {
  apiKey: string;
  secret: string;
  passphrase: string;
};

export interface ClobClientAdapter {
  init(cfg?: AdapterInitConfig): Promise<void>;
  getConfig(): ResolvedAdapterConfig;
  listMarkets(): Promise<Market[]>;
  getOrderBook(tokenID: string): Promise<OrderBook>;
  createOrder(
    req: PlaceOrderRequest & { idempotencyKey?: string },
    signer: any,
    creds: ApiCredentials
  ): Promise<any>;
  postOrder(order: any, orderType: OrderType, signer: any, creds: ApiCredentials): Promise<Order>;
  postOrders(
    args: { order: any; orderType: OrderType }[],
    signer: any,
    creds: ApiCredentials
  ): Promise<Order[]>;
  cancelOrder(orderId: string, signer: any, creds: ApiCredentials): Promise<void>;
  cancelAll(signer: any, creds: ApiCredentials): Promise<void>;
  getOpenOrders(
    filter: { market?: string; asset_id?: string },
    signer: any,
    creds: ApiCredentials
  ): Promise<Order[]>;
  getTrades(
    filter: { market?: string; asset_id?: string; maker_address?: string },
    firstPageOnly: boolean | undefined,
    signer: any,
    creds: ApiCredentials
  ): Promise<TradeEvent[]>;
  getPricesHistory(filter: any, signer: any, creds: ApiCredentials): Promise<any>;
  getBalance(signer: any, creds: ApiCredentials): Promise<Balance>;
}

export class PolymarketClobAdapter implements ClobClientAdapter {
  private initialized = false;
  private cfg: ResolvedAdapterConfig | undefined;
  private roClient: any | null = null; // read-only ClobClient (no wallet)

  async init(cfg: AdapterInitConfig = {}): Promise<void> {
    this.cfg = {
      apiUrl: cfg.apiUrl ?? process.env.CLOB_API_URL ?? 'https://clob.polymarket.com',
      wsUrl: cfg.wsUrl ?? process.env.WS_URL ?? 'wss://ws-subscriptions-clob.polymarket.com/ws',
      chainId: cfg.chainId ?? Number(process.env.CHAIN_ID ?? 137),
    } satisfies ResolvedAdapterConfig;
    this.initialized = true;
  }

  getConfig(): ResolvedAdapterConfig {
    this.ensureInit();
    return { ...this.cfg! };
  }

  private ensureInit() {
    if (!this.initialized) throw new Error('PolymarketClobAdapter not initialized');
  }

  private async getReadOnlyClient(): Promise<any> {
    this.ensureInit();
    if (this.roClient) return this.roClient;
    const host = this.cfg!.apiUrl;
    const chainId = this.cfg!.chainId;
    this.roClient = new ClobClient(host, chainId);
    return this.roClient;
  }

  private getWriteClient(signer: any, creds: ApiCredentials): any {
    this.ensureInit();
    const { apiUrl, chainId } = this.cfg!;
    const { apiKey, secret, passphrase } = creds;
    return new ClobClient(apiUrl, chainId, signer, { key: apiKey, secret, passphrase });
  }

  async listMarkets(): Promise<Market[]> {
    const client = await this.getReadOnlyClient();
    let resp: any =
      (typeof client.getSimplifiedMarkets === 'function'
        ? await client.getSimplifiedMarkets()
        : null) ?? null;

    if (!resp || this.unwrapList(resp).length === 0) {
      resp = (typeof client.getMarkets === 'function' ? await client.getMarkets() : null) ?? [];
    }

    const list = this.unwrapList(resp);
    return list.map((raw) => this.mapMarket(raw)).filter((m): m is Market => !!m);
  }

  async getOrderBook(tokenID: string): Promise<OrderBook> {
    const client = await this.getReadOnlyClient();
    const ob = await client.getOrderBook(tokenID);
    // Normalize orderbook into bids/asks arrays of {price,size}
    const mapSide = (side: any[]): BookLevel[] =>
      (Array.isArray(side) ? side : []).map((lv: any) => ({
        price: Number(lv.price ?? lv[0] ?? 0),
        size: Number(lv.size ?? lv[1] ?? 0),
        count: Number(lv.count ?? lv[2] ?? 1),
      }));
    const bids = mapSide(ob.bids || ob.buy || ob.bid || []);
    const asks = mapSide(ob.asks || ob.sell || ob.ask || []);
    const bestBid = bids[0]?.price;
    const bestAsk = asks[0]?.price;
    return {
      marketId: tokenID,
      bids,
      asks,
      ts: Date.now(),
      mid:
        typeof bestBid === 'number' && typeof bestAsk === 'number'
          ? (bestBid + bestAsk) / 2
          : undefined,
      spread:
        typeof bestBid === 'number' && typeof bestAsk === 'number' ? bestAsk - bestBid : undefined,
    };
  }
  async createOrder(
    req: PlaceOrderRequest & { idempotencyKey?: string },
    signer: any,
    creds: ApiCredentials
  ): Promise<any> {
    const client = this.getWriteClient(signer, creds);
    // Determine GTD min expiration
    const nowSec = Math.floor(Date.now() / 1000);
    const safeExp = (exp?: number) => {
      if (!exp) return undefined;
      const min = nowSec + 10; // security threshold per examples
      return exp < min ? min : exp;
    };
    if (!req.tokenID && !(req.marketId && req.outcome)) {
      throw new Error('createOrder requires tokenID or (marketId + outcome)');
    }
    const tokenID = req.tokenID || req.marketId; // TODO: map marketId+outcome→tokenID via markets cache
    if (!tokenID) throw new Error('tokenID resolution failed');

    if (req.amount && (req.orderType === 'FAK' || req.orderType === 'FOK')) {
      // Market order path
      return client.createMarketOrder({
        tokenID,
        amount: req.amount,
        side: req.side === 'SELL' ? SDKSide.SELL : SDKSide.BUY,
        orderType: this.mapOrderType(req.orderType),
      });
    }
    // Limit order path
    if (typeof req.price !== 'number' || typeof req.size !== 'number') {
      throw new Error('Limit order requires price and size');
    }
    return client.createOrder({
      tokenID,
      price: req.price,
      side: req.side === 'SELL' ? SDKSide.SELL : SDKSide.BUY,
      size: req.size,
      expiration: safeExp(req.expiration),
    });
  }
  async postOrder(
    order: any,
    orderType: OrderType,
    signer: any,
    creds: ApiCredentials
  ): Promise<Order> {
    const client = this.getWriteClient(signer, creds);
    const sdkOrderType = this.mapOrderType(orderType);
    const resp = await client.postOrder(order, sdkOrderType);
    return this.mapOrder(resp);
  }
  async postOrders(
    args: { order: any; orderType: OrderType }[],
    signer: any,
    creds: ApiCredentials
  ): Promise<Order[]> {
    const client = this.getWriteClient(signer, creds);
    const payload = args.map((a) => ({
      order: a.order,
      orderType: this.mapOrderType(a.orderType),
    }));
    const resp = await client.postOrders(payload);
    return Array.isArray(resp) ? resp.map((r: any) => this.mapOrder(r)) : [];
  }
  async cancelOrder(orderId: string, signer: any, creds: ApiCredentials): Promise<void> {
    const client = this.getWriteClient(signer, creds);
    await client.cancelOrder({ orderID: orderId });
  }
  async cancelAll(signer: any, creds: ApiCredentials): Promise<void> {
    const client = this.getWriteClient(signer, creds);
    await client.cancelAll();
  }
  async getOpenOrders(
    filter: { market?: string; asset_id?: string },
    signer: any,
    creds: ApiCredentials
  ): Promise<Order[]> {
    const client = this.getWriteClient(signer, creds);
    const resp = await client.getOpenOrders(filter, true);
    return Array.isArray(resp?.data || resp)
      ? (resp.data || resp).map((r: any) => this.mapOrder(r))
      : [];
  }
  async getTrades(
    filter: { market?: string; asset_id?: string; maker_address?: string },
    firstPageOnly: boolean | undefined,
    signer: any,
    creds: ApiCredentials
  ): Promise<TradeEvent[]> {
    const client = this.getWriteClient(signer, creds);
    const resp = await client.getTrades(filter, !!firstPageOnly);
    const list = this.unwrapList(resp);
    return list.map((t) => this.mapTrade(t));
  }
  async getPricesHistory(filter: any, signer: any, creds: ApiCredentials): Promise<any> {
    const client = this.getWriteClient(signer, creds);
    return client.getPricesHistory(filter);
  }
  async getBalance(signer: any, creds: ApiCredentials): Promise<Balance> {
    const client = this.getWriteClient(signer, creds);
    console.log('getBalance', client);
    const collateral = await client.getBalanceAllowance({
      asset_type: AssetType.COLLATERAL,
    });
    return {
      usdc: Number(collateral?.balance || 0),
      allowance: Number(collateral?.allowance || 0),
    };
  }

  // Helpers
  private mapOrderType(t: OrderType): any {
    const map: Record<OrderType, any> = {
      GTC: SDKOrderType.GTC,
      GTD: SDKOrderType.GTD,
      FAK: SDKOrderType.FAK,
      FOK: SDKOrderType.FOK,
    };
    return map[t] ?? SDKOrderType.GTC;
  }

  private mapOrder(o: any): Order {
    return {
      id: String(o.id || o.orderID || o.orderId || o.txHash || ''),
      clientOrderId: o.clientOrderId || o.client_id,
      marketId: String(o.market || o.marketId || o.asset_id || o.tokenID || ''),
      outcome: (o.outcome || o.token_outcome || 'YES') as Outcome,
      side: ((o.side || '').toUpperCase() === 'SELL' ? 'SELL' : 'BUY') as TradeSide,
      price: Number(o.price ?? 0),
      size: Number(o.size ?? o.qty ?? 0),
      filled: Number(o.filled ?? o.filledQty ?? 0),
      status: (o.status || 'OPEN') as OrderStatus,
      orderType: (o.orderType || 'GTC') as OrderType,
      tokenID: o.tokenID || o.asset_id,
      expiration: o.expiration ? Number(o.expiration) : undefined,
      createdAt: Number(o.createdAt || Date.now()),
      updatedAt: Number(o.updatedAt || Date.now()),
    };
  }

  private mapTrade(t: any): TradeEvent {
    return {
      tradeId: t.tradeId || t.trade_id || t.id || undefined,
      orderId: String(t.orderId || t.order_id || t.orderID || t.fill_id || ''),
      price: this.toNumber(t.price ?? t.execution_price ?? t.avg_price, 0),
      size: this.toNumber(t.size ?? t.qty ?? t.quantity ?? t.amount, 0),
      liquidity: t.liquidity
        ? String(t.liquidity).toUpperCase() === 'MAKER'
          ? 'MAKER'
          : 'TAKER'
        : undefined,
      feePaid:
        t.fee != null || t.feePaid != null ? this.toNumber(t.fee ?? t.feePaid, 0) : undefined,
      ts: Number(t.ts || t.timestamp || t.time || Date.now()),
    };
  }

  private unwrapList(payload: any): any[] {
    if (Array.isArray(payload)) return payload;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  }

  private mapMarket(raw: any): Market | null {
    if (!raw) return null;
    const idCandidate =
      raw.id ||
      raw.market ||
      raw.market_id ||
      raw.marketId ||
      raw.condition_id ||
      raw.conditionId ||
      raw.slug ||
      raw.token_id ||
      raw.tokenId;
    if (!idCandidate) return null;
    const tokenIdYes =
      raw.yesTokenId || raw.yes_token_id || raw.token_id_yes || raw.tokenYesId || raw.yes_token;
    const tokenIdNo =
      raw.noTokenId || raw.no_token_id || raw.token_id_no || raw.tokenNoId || raw.no_token;
    const outcomes: Outcome[] = [];
    if (tokenIdYes) outcomes.push('YES');
    if (tokenIdNo) outcomes.push('NO');
    if (outcomes.length === 0) outcomes.push('YES', 'NO');
    return {
      id: String(idCandidate),
      slug: raw.slug ?? raw.marketSlug ?? undefined,
      question: raw.question || raw.title || raw.name,
      outcomes,
      tickSize: this.toNumber(
        raw.tickSize ?? raw.tick_size ?? raw.tick_size_str ?? raw.tick ?? raw.tick_size_decimal,
        0.01
      ),
      minPrice: this.maybeNumber(raw.minPrice ?? raw.min_price),
      maxPrice: this.maybeNumber(raw.maxPrice ?? raw.max_price),
      minSize: this.maybeNumber(raw.minSize ?? raw.min_size ?? raw.min_trade_size),
      feeBps: this.toNumber(raw.feeBps ?? raw.fee_bps ?? raw.fee, 0),
      status: this.mapMarketStatus(raw.status ?? raw.marketStatus ?? raw.state ?? 'TRADING'),
      clobSymbol: raw.symbol || raw.clobSymbol || raw.ticker,
      conditionId: raw.condition_id || raw.conditionId,
      tokenIdYes: tokenIdYes ? String(tokenIdYes) : undefined,
      tokenIdNo: tokenIdNo ? String(tokenIdNo) : undefined,
    };
  }

  private toNumber(value: any, fallback: number): number {
    if (value == null) return fallback;
    const v = typeof value === 'string' ? Number(value) : value;
    return Number.isFinite(v) ? Number(v) : fallback;
  }

  private maybeNumber(value: any): number | undefined {
    const parsed = this.toNumber(value, Number.NaN);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private mapMarketStatus(value: any): MarketStatus {
    const normalized = String(value || 'TRADING').toUpperCase();
    if (normalized === 'SETTLING' || normalized === 'CLOSED') {
      return normalized as MarketStatus;
    }
    return 'TRADING';
  }
}

export default PolymarketClobAdapter;
