import PolymarketClobAdapter, {
  AdapterInitConfig,
} from "@/services/polymarket/clob-adapter";
import PolymarketWSClient, {
  UserSubscription,
  WsClientOptions,
  WsMessage,
  WsStatus,
} from "@/services/polymarket/ws-client";
import {
  Balance,
  Order,
  TradeEvent,
} from "@/services/polymarket/types";

export interface AccountSnapshot {
  address?: string;
  balance: Balance;
  openOrders: Order[];
  recentTrades: TradeEvent[];
  lastUpdated: number;
}

export type AccountStreamEvent =
  | { type: "snapshot"; snapshot: AccountSnapshot }
  | { type: "balance"; balance: Balance; ts: number }
  | { type: "order"; order: Order; ts: number }
  | { type: "order-removed"; order: Order; ts: number }
  | { type: "trade"; trade: TradeEvent; ts: number }
  | { type: "raw"; payload: WsMessage; ts: number }
  | { type: "error"; error: string; ts: number };

export interface AccountStream {
  close: () => Promise<void>;
  onEvent: (listener: (event: AccountStreamEvent) => void) => () => void;
  getStatus: () => { wsStatus: WsStatus; lastEventTs?: number };
}

export interface WatchAccountOptions {
  address?: string;
  credentials?: {
    apiKey: string;
    secret: string;
    passphrase: string;
  };
  adapterConfig?: AdapterInitConfig;
  pollIntervalMs?: number;
  markets?: string[];
  assetsIds?: string[];
}

export interface AccountHealth {
  apiKeyValid: boolean | null;
  wsConnected: boolean | null;
  wsStatus: WsStatus;
  rateLimitErrors: number;
  clockSkewMs?: number;
  balance?: Balance;
  notes: string[];
  checkedAt: number;
}

export class AccountService {
  constructor() {}

  async getSnapshot(
    address?: string,
    config?: AdapterInitConfig
  ): Promise<AccountSnapshot> {
    const adapter = await this.createAdapter(config);
    return this.collectSnapshot(adapter, address);
  }

  async watchAccount(options: WatchAccountOptions = {}): Promise<AccountStream> {
    const adapter = await this.createAdapter({
      ...options.adapterConfig,
      apiKey: options.credentials?.apiKey ?? options.adapterConfig?.apiKey,
      secret: options.credentials?.secret ?? options.adapterConfig?.secret,
      passphrase:
        options.credentials?.passphrase ?? options.adapterConfig?.passphrase,
    });

    const listeners = new Set<(event: AccountStreamEvent) => void>();
    const emit = (event: AccountStreamEvent) => {
      for (const listener of listeners) listener(event);
    };

    const snapshot = await this.collectSnapshot(adapter, options.address);
    emit({ type: "snapshot", snapshot });
    emit({ type: "balance", balance: snapshot.balance, ts: snapshot.lastUpdated });

    let lastBalance = snapshot.balance;
    let lastOrders = new Map(snapshot.openOrders.map((o) => [o.id, o]));
    let seenTrades = new Set(
      snapshot.recentTrades.map((t) => t.tradeId || `${t.orderId}-${t.ts}`)
    );

    const pollInterval = options.pollIntervalMs ?? 15000;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    if (pollInterval > 0) {
      pollTimer = setInterval(async () => {
        try {
          const next = await this.collectSnapshot(adapter, options.address);
          const now = Date.now();

          if (!this.balanceEqual(lastBalance, next.balance)) {
            lastBalance = next.balance;
            emit({ type: "balance", balance: next.balance, ts: now });
          }

          const nextOrders = new Map(next.openOrders.map((o) => [o.id, o]));
          for (const order of next.openOrders) {
            const prev = lastOrders.get(order.id);
            if (!prev || !this.orderEqual(prev, order)) {
              emit({ type: "order", order, ts: now });
            }
          }
          for (const [id, prev] of lastOrders.entries()) {
            if (!nextOrders.has(id)) {
              emit({ type: "order-removed", order: prev, ts: now });
            }
          }
          lastOrders = nextOrders;

          for (const trade of next.recentTrades) {
            const key = trade.tradeId || `${trade.orderId}-${trade.ts}-${trade.size}`;
            if (!seenTrades.has(key)) {
              seenTrades.add(key);
              emit({ type: "trade", trade, ts: now });
            }
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          emit({ type: "error", error: message, ts: Date.now() });
        }
      }, pollInterval);
    }

    let wsClient: PolymarketWSClient | null = null;
    let wsStatus: WsStatus = "idle";
    let lastEventTs: number | undefined = undefined;

    if (options.credentials) {
      const cfg = adapter.getConfig();
      const wsUrl = cfg.wsUrl.endsWith("/user") ? cfg.wsUrl : `${cfg.wsUrl}/user`;
      const wsOptions: WsClientOptions = {
        url: wsUrl,
        autoReconnect: true,
        onMessage: (msg) => {
          lastEventTs = Date.now();
          emit({ type: "raw", payload: msg, ts: lastEventTs });
        },
        onError: (err) => {
          emit({ type: "error", error: String(err), ts: Date.now() });
        },
        onStatusChange: (status) => {
          wsStatus = status;
        },
      };
      wsClient = new PolymarketWSClient(wsOptions);
      try {
        await wsClient.connect();
        const subscription: UserSubscription = {
          auth: {
            apiKey: options.credentials.apiKey,
            secret: options.credentials.secret,
            passphrase: options.credentials.passphrase,
          },
          markets: options.markets ?? [],
          assets_ids: options.assetsIds ?? [],
          initial_dump: true,
        };
        await wsClient.subscribe("user", subscription);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        emit({ type: "error", error: message, ts: Date.now() });
      }
    }

    const close = async () => {
      if (pollTimer) {
        clearInterval(pollTimer);
      }
      if (wsClient) {
        await wsClient.close(true);
      }
    };

    const onEvent = (listener: (event: AccountStreamEvent) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };

    return {
      close,
      onEvent,
      getStatus: () => ({ wsStatus, lastEventTs }),
    };
  }

  async getAccountHealth(
    options: WatchAccountOptions = {}
  ): Promise<AccountHealth> {
    const notes: string[] = [];
    let balance: Balance | undefined;
    let apiKeyValid: boolean | null = null;

    try {
      const adapter = await this.createAdapter({
        ...options.adapterConfig,
        apiKey: options.credentials?.apiKey ?? options.adapterConfig?.apiKey,
        secret: options.credentials?.secret ?? options.adapterConfig?.secret,
        passphrase:
          options.credentials?.passphrase ?? options.adapterConfig?.passphrase,
      });
      const snapshot = await this.collectSnapshot(adapter, options.address);
      balance = snapshot.balance;
      apiKeyValid = options.credentials ? true : null;
    } catch (err: unknown) {
      apiKeyValid = options.credentials ? false : null;
      const message = err instanceof Error ? err.message : String(err);
      notes.push(`balance_check_failed: ${message}`);
    }

    let wsConnected: boolean | null = null;
    let wsStatus: WsStatus = "idle";

    if (options.credentials) {
      try {
        const adapter = await this.createAdapter({
          ...options.adapterConfig,
          apiKey: options.credentials.apiKey,
          secret: options.credentials.secret,
          passphrase: options.credentials.passphrase,
        });
        const cfg = adapter.getConfig();
        const client = new PolymarketWSClient({
          url: cfg.wsUrl.endsWith("/user") ? cfg.wsUrl : `${cfg.wsUrl}/user`,
          autoReconnect: false,
          onStatusChange: (status) => {
            wsStatus = status;
          },
        });
        await client.connect();
        await client.subscribe("user", {
          auth: {
            apiKey: options.credentials.apiKey,
            secret: options.credentials.secret,
            passphrase: options.credentials.passphrase,
          },
          initial_dump: false,
        });
        wsConnected = true;
        await client.close(true);
      } catch (err: unknown) {
        wsConnected = false;
        const message = err instanceof Error ? err.message : String(err);
        notes.push(`ws_connect_failed: ${message}`);
      }
    }

    return {
      apiKeyValid,
      wsConnected,
      wsStatus,
      rateLimitErrors: 0,
      clockSkewMs: undefined,
      balance,
      notes,
      checkedAt: Date.now(),
    };
  }

  private async createAdapter(
    config?: AdapterInitConfig
  ): Promise<PolymarketClobAdapter> {
    const adapter = new PolymarketClobAdapter();
    await adapter.init(config);
    return adapter;
  }

  private async collectSnapshot(
    adapter: PolymarketClobAdapter,
    address?: string
  ): Promise<AccountSnapshot> {
    try {
      const [balance, openOrders, recentTrades] = await Promise.all([
        adapter.getBalance(),
        adapter.getOpenOrders({}),
        adapter.getTrades(
          address ? { maker_address: address } : {},
          true
        ),
      ]);
      return {
        address,
        balance,
        openOrders,
        recentTrades,
        lastUpdated: Date.now(),
      };
    } catch (err) {
      return {
        address,
        balance: { usdc: 0 },
        openOrders: [],
        recentTrades: [],
        lastUpdated: Date.now(),
      };
    }
  }

  private balanceEqual(a: Balance, b: Balance) {
    return (
      a.usdc === b.usdc &&
      (a.allowance ?? 0) === (b.allowance ?? 0) &&
      (a.outcomeYes ?? 0) === (b.outcomeYes ?? 0) &&
      (a.outcomeNo ?? 0) === (b.outcomeNo ?? 0)
    );
  }

  private orderEqual(a: Order, b: Order) {
    return (
      a.status === b.status &&
      a.filled === b.filled &&
      a.price === b.price &&
      a.size === b.size
    );
  }
}

export default AccountService;
