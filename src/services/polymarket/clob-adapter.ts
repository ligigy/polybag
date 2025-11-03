// Polymarket CLOB adapter skeleton
// NOTE: This is a scaffold. It defines the adapter interface and a basic class
// with unimplemented methods that will be filled in during implementation.

export type Outcome = "YES" | "NO";
export type TradeSide = "BUY" | "SELL";
export type OrderType = "GTC" | "GTD" | "FAK" | "FOK";

export interface Market {
  id: string;
  slug?: string;
  question?: string;
  status?: string;
  conditionId?: string;
  tokenIdYes?: string;
  tokenIdNo?: string;
  tickSize: number;
  feeBps: number;
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
  tokenID?: string;
  expiration?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Balance {
  usdc: number;
  allowance?: number;
  outcomeYes?: number;
  outcomeNo?: number;
}

export interface ClobClientAdapter {
  init(cfg?: {
    apiUrl?: string;
    wsUrl?: string;
    apiKey?: string;
    secret?: string;
    passphrase?: string;
    chainId?: number;
    privateKey?: string;
    rpcUrl?: string;
  }): Promise<void>;
  listMarkets(): Promise<Market[]>;
  getOrderBook(tokenID: string): Promise<OrderBook>;
  createOrder(
    req: PlaceOrderRequest & { idempotencyKey?: string }
  ): Promise<any>;
  postOrder(order: any, orderType: OrderType): Promise<Order>;
  postOrders(args: { order: any; orderType: OrderType }[]): Promise<Order[]>;
  cancelOrder(orderId: string): Promise<void>;
  cancelAll(): Promise<void>;
  getOpenOrders(filter: {
    market?: string;
    asset_id?: string;
  }): Promise<Order[]>;
  getTrades(
    filter: { market?: string; asset_id?: string; maker_address?: string },
    firstPageOnly?: boolean
  ): Promise<any[]>;
  getPricesHistory(filter: any): Promise<any>;
  getBalanceAllowance(): Promise<Balance>;
}

export class PolymarketClobAdapter implements ClobClientAdapter {
  private initialized = false;
  private cfg:
    | Required<NonNullable<Parameters<PolymarketClobAdapter["init"]>[0]>>
    | undefined;
  private roClient: any | null = null; // read-only ClobClient (no wallet)
  private rwClient: any | null = null; // read-write ClobClient (wallet + creds)

  async init(cfg = {}): Promise<void> {
    // Store config; real implementation will instantiate ClobClient here
    this.cfg = {
      apiUrl:
        cfg.apiUrl ?? process.env.CLOB_API_URL ?? "https://clob.polymarket.com",
      wsUrl:
        cfg.wsUrl ??
        process.env.WS_URL ??
        "wss://ws-subscriptions-clob.polymarket.com/ws",
      apiKey: cfg.apiKey ?? process.env.CLOB_API_KEY ?? "",
      secret: cfg.secret ?? process.env.CLOB_SECRET ?? "",
      passphrase: cfg.passphrase ?? process.env.CLOB_PASS_PHRASE ?? "",
      chainId: cfg.chainId ?? Number(process.env.CHAIN_ID ?? 137),
      privateKey: cfg.privateKey ?? process.env.WALLET_PRIVATE_KEY ?? "",
      rpcUrl: cfg.rpcUrl ?? process.env.POLYGON_RPC_URL ?? "",
    } as any;
    this.initialized = true;
  }

  private ensureInit() {
    if (!this.initialized)
      throw new Error("PolymarketClobAdapter not initialized");
  }

  private async getReadOnlyClient(): Promise<any> {
    this.ensureInit();
    if (this.roClient) return this.roClient;
    let ClobClient: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ClobClient = require("@polymarket/clob-client").ClobClient;
    } catch (e) {
      throw new Error(
        "Missing dependency @polymarket/clob-client. Please install it."
      );
    }
    const host = this.cfg!.apiUrl;
    const chainId = this.cfg!.chainId;
    this.roClient = new ClobClient(host, chainId);
    return this.roClient;
  }

  private async getWriteClient(): Promise<any> {
    this.ensureInit();
    if (this.rwClient) return this.rwClient;
    let ClobClient: any;
    let ethers: any;
    try {
      ClobClient = require("@polymarket/clob-client").ClobClient;
      ethers = require("ethers");
    } catch (e) {
      throw new Error(
        "Missing dependency @polymarket/clob-client or ethers. Please install them."
      );
    }
    const { apiUrl, chainId, privateKey, rpcUrl, apiKey, secret, passphrase } =
      this.cfg!;
    if (!privateKey || !apiKey || !secret || !passphrase) {
      throw new Error(
        "Write client requires WALLET_PRIVATE_KEY and CLOB_API_KEY/SECRET/PASS_PHRASE"
      );
    }
    const provider = rpcUrl
      ? new ethers.providers.JsonRpcProvider(rpcUrl)
      : undefined;
    const wallet = provider
      ? new ethers.Wallet(privateKey, provider)
      : new ethers.Wallet(privateKey);
    const creds = { key: apiKey, secret, passphrase };
    this.rwClient = new ClobClient(apiUrl, chainId, wallet, creds);
    return this.rwClient;
  }

  async listMarkets(): Promise<Market[]> {
    const client = await this.getReadOnlyClient();
    // Prefer simplified markets for lighter payload
    const resp = await client.getMarkets?.();

    if (!resp) return [];
    // Unwrap paginated shape { data, next_cursor, limit, count }
    const list: any[] = Array.isArray(resp)
      ? resp
      : Array.isArray(resp.data)
      ? resp.data
      : [];
    // Best-effort mapping; field names depend on SDK/version
    return list.map((m: any) => ({
      id:
        m.id ||
        m.market ||
        m.condition_id ||
        m.conditionId ||
        m.slug ||
        String(m.token_id || m.tokenId || ""),
      slug: m.slug,
      question: m.question || m.title,
      status: m.status,
      conditionId: m.condition_id || m.conditionId,
      tokenIdYes: m.yesTokenId || m.yes_token_id || m.token_id_yes,
      tokenIdNo: m.noTokenId || m.no_token_id || m.token_id_no,
      tickSize: Number(
        m.tickSize ||
          m.tick_size ||
          m.tick_size_str ||
          m.tick ||
          m.tick_size_decimal ||
          0.01
      ),
      feeBps: Number(m.feeBps || m.fee_bps || m.fee || 0),
    }));
  }

  async getOrderBook(tokenID: string): Promise<OrderBook> {
    const client = await this.getReadOnlyClient();
    const ob = await client.getOrderBook(tokenID);
    // Normalize orderbook into bids/asks arrays of {price,size}
    const mapSide = (side: any[]) =>
      (Array.isArray(side) ? side : []).map((lv: any) => ({
        price: Number(lv.price ?? lv[0] ?? 0),
        size: Number(lv.size ?? lv[1] ?? 0),
        count: Number(lv.count ?? lv[2] ?? 1),
      }));
    return {
      marketId: tokenID,
      bids: mapSide(ob.bids || ob.buy || ob.bid || []),
      asks: mapSide(ob.asks || ob.sell || ob.ask || []),
      ts: Date.now(),
    };
  }
  async createOrder(
    req: PlaceOrderRequest & { idempotencyKey?: string }
  ): Promise<any> {
    const client = await this.getWriteClient();
    const SDK = require("@polymarket/clob-client");
    const Side = SDK.Side || { BUY: "BUY", SELL: "SELL" };
    // Determine GTD min expiration
    const nowSec = Math.floor(Date.now() / 1000);
    const safeExp = (exp?: number) => {
      if (!exp) return undefined;
      const min = nowSec + 10; // security threshold per examples
      return exp < min ? min : exp;
    };
    if (!req.tokenID && !(req.marketId && req.outcome)) {
      throw new Error("createOrder requires tokenID or (marketId + outcome)");
    }
    const tokenID = req.tokenID || req.marketId; // TODO: map marketId+outcome→tokenID via markets cache
    if (!tokenID) throw new Error("tokenID resolution failed");

    if (req.amount && (req.orderType === "FAK" || req.orderType === "FOK")) {
      // Market order path
      return client.createMarketOrder({
        tokenID,
        amount: req.amount,
        side: req.side === "SELL" ? Side.SELL : Side.BUY,
        orderType: this.mapOrderType(req.orderType),
      });
    }
    // Limit order path
    if (typeof req.price !== "number" || typeof req.size !== "number") {
      throw new Error("Limit order requires price and size");
    }
    return client.createOrder({
      tokenID,
      price: req.price,
      side: req.side === "SELL" ? Side.SELL : Side.BUY,
      size: req.size,
      expiration: safeExp(req.expiration),
    });
  }
  async postOrder(order: any, orderType: OrderType): Promise<Order> {
    const client = await this.getWriteClient();
    const sdkOrderType = this.mapOrderType(orderType);
    const resp = await client.postOrder(order, sdkOrderType);
    return this.mapOrder(resp);
  }
  async postOrders(
    args: { order: any; orderType: OrderType }[]
  ): Promise<Order[]> {
    const client = await this.getWriteClient();
    const payload = args.map((a) => ({
      order: a.order,
      orderType: this.mapOrderType(a.orderType),
    }));
    const resp = await client.postOrders(payload);
    return Array.isArray(resp) ? resp.map((r: any) => this.mapOrder(r)) : [];
  }
  async cancelOrder(orderId: string): Promise<void> {
    const client = await this.getWriteClient();
    await client.cancelOrder({ orderID: orderId });
  }
  async cancelAll(): Promise<void> {
    const client = await this.getWriteClient();
    await client.cancelAll();
  }
  async getOpenOrders(filter: {
    market?: string;
    asset_id?: string;
  }): Promise<Order[]> {
    const client = await this.getWriteClient();
    const resp = await client.getOpenOrders(filter, true);
    return Array.isArray(resp?.data || resp)
      ? (resp.data || resp).map((r: any) => this.mapOrder(r))
      : [];
  }
  async getTrades(
    filter: { market?: string; asset_id?: string; maker_address?: string },
    firstPageOnly?: boolean
  ): Promise<any[]> {
    const client = await this.getWriteClient();
    const resp = await client.getTrades(filter, !!firstPageOnly);
    return Array.isArray(resp?.data || resp) ? resp.data || resp : [];
  }
  async getPricesHistory(filter: any): Promise<any> {
    const client = await this.getWriteClient();
    return client.getPricesHistory(filter);
  }
  async getBalanceAllowance(): Promise<Balance> {
    const client = await this.getWriteClient();
    let AssetType: any;
    try {
      AssetType = require("@polymarket/clob-client").AssetType;
    } catch {
      throw new Error("Missing @polymarket/clob-client for AssetType");
    }
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
    try {
      const SDK = require("@polymarket/clob-client");
      const map: Record<OrderType, any> = {
        GTC: SDK.OrderType.GTC,
        GTD: SDK.OrderType.GTD,
        FAK: SDK.OrderType.FAK,
        FOK: SDK.OrderType.FOK,
      };
      return map[t] ?? SDK.OrderType.GTC;
    } catch {
      return t;
    }
  }

  private mapOrder(o: any): Order {
    return {
      id: String(o.id || o.orderID || o.orderId || o.txHash || ""),
      clientOrderId: o.clientOrderId || o.client_id,
      marketId: String(o.market || o.marketId || o.asset_id || o.tokenID || ""),
      outcome: (o.outcome || o.token_outcome || "YES") as Outcome,
      side: ((o.side || "").toUpperCase() === "SELL"
        ? "SELL"
        : "BUY") as TradeSide,
      price: Number(o.price ?? 0),
      size: Number(o.size ?? o.qty ?? 0),
      filled: Number(o.filled ?? o.filledQty ?? 0),
      status: (o.status || "OPEN") as OrderStatus,
      orderType: (o.orderType || "GTC") as OrderType,
      tokenID: o.tokenID || o.asset_id,
      expiration: o.expiration ? Number(o.expiration) : undefined,
      createdAt: Number(o.createdAt || Date.now()),
      updatedAt: Number(o.updatedAt || Date.now()),
    };
  }
}

export default PolymarketClobAdapter;
