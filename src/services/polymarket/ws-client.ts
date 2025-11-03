// Polymarket WebSocket 客户端封装
// 支持市场与用户订阅、自动重连、心跳 PING、初始快照与状态事件。

export type FeedType = "market" | "user";

export interface MarketSubscription {
  markets?: string[]; // condition_ids
  assets_ids?: string[]; // tokenIDs (YES/NO)
  initial_dump?: boolean;
}

export interface UserAuth {
  apiKey: string;
  secret: string;
  passphrase: string;
}

export interface UserSubscription extends MarketSubscription {
  auth: UserAuth;
}

export interface WsMessage {
  type: string;
  [k: string]: unknown;
}

export type WsStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "closed";

export interface WsClientOptions {
  url: string; // e.g. wss://.../ws/market 或 /ws/user
  pingIntervalMs?: number;
  reconnectBaseMs?: number;
  maxReconnectIntervalMs?: number;
  autoReconnect?: boolean;
  onMessage?: (msg: WsMessage) => void;
  onError?: (err: unknown) => void;
  onClose?: (meta: { code: number; reason: string; byUser: boolean }) => void;
  onStatusChange?: (status: WsStatus, attempt?: number) => void;
}

interface Subscription {
  feed: FeedType;
  payload: MarketSubscription | UserSubscription;
}

const DEFAULT_PING_MS = 50_000;
const DEFAULT_RECONNECT_BASE_MS = 1_000;
const DEFAULT_RECONNECT_MAX_MS = 30_000;

export class PolymarketWSClient {
  private opts: WsClientOptions;
  private ws: any | null = null;
  private WebSocketCtor: any | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private shouldReconnect = true;
  private status: WsStatus = "idle";
  private subscriptions: Subscription[] = [];

  constructor(opts: WsClientOptions) {
    this.opts = {
      autoReconnect: true,
      pingIntervalMs: DEFAULT_PING_MS,
      reconnectBaseMs: DEFAULT_RECONNECT_BASE_MS,
      maxReconnectIntervalMs: DEFAULT_RECONNECT_MAX_MS,
      ...opts,
    };
  }

  getStatus() {
    return this.status;
  }

  async connect(): Promise<void> {
    await this.open(false);
  }

  async subscribe(
    feed: FeedType,
    payload: MarketSubscription | UserSubscription
  ): Promise<void> {
    const enriched: Subscription = {
      feed,
      payload: {
        initial_dump: payload.initial_dump ?? true,
        markets: payload.markets ?? [],
        assets_ids: payload.assets_ids ?? [],
        ...(payload as Record<string, unknown>),
      } as MarketSubscription | UserSubscription,
    };
    const idx = this.subscriptions.findIndex(
      (sub) => sub.feed === feed && JSON.stringify(sub.payload) === JSON.stringify(enriched.payload)
    );
    if (idx === -1) {
      this.subscriptions.push(enriched);
    } else {
      this.subscriptions[idx] = enriched;
    }
    this.sendSubscription(enriched);
  }

  async subscribeMarket(payload: MarketSubscription): Promise<void> {
    return this.subscribe("market", payload);
  }

  async subscribeUser(payload: UserSubscription): Promise<void> {
    if (!payload.auth) {
      throw new Error("User feed requires auth credentials");
    }
    return this.subscribe("user", payload);
  }

  async close(permanent = true): Promise<void> {
    if (permanent) {
      this.shouldReconnect = false;
      this.updateStatus("closed");
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.ws) {
      try {
        // 关闭前去除事件监听，避免触发重复回调
        const ws = this.ws;
        if (typeof ws.removeEventListener === "function") {
          ws.removeEventListener("message", this.handleMessage);
          ws.removeEventListener("error", this.handleError);
          ws.removeEventListener("close", this.handleClose);
          ws.removeEventListener("open", this.handleOpen);
        } else if (typeof ws.off === "function") {
          ws.off("message", this.handleMessage);
          ws.off("error", this.handleError);
          ws.off("close", this.handleClose);
          ws.off("open", this.handleOpen);
        } else if (typeof ws.removeListener === "function") {
          ws.removeListener("message", this.handleMessage);
          ws.removeListener("error", this.handleError);
          ws.removeListener("close", this.handleClose);
          ws.removeListener("open", this.handleOpen);
        }
        ws.close();
      } catch {
        // ignore
      }
    }
    this.ws = null;
  }

  private async open(isReconnect: boolean): Promise<void> {
    await this.ensureCtor();
    this.updateStatus(isReconnect ? "reconnecting" : "connecting");

    if (this.ws) {
      await this.close(false);
    }

    this.ws = new this.WebSocketCtor(this.opts.url);

    this.bindEvent("open", this.handleOpen);
    this.bindEvent("message", this.handleMessage);
    this.bindEvent("error", this.handleError);
    this.bindEvent("close", this.handleClose);

    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      try {
        this.ws?.send("PING");
      } catch (err) {
        this.opts.onError?.(err);
      }
    }, this.opts.pingIntervalMs);
  }

  private async ensureCtor() {
    if (this.WebSocketCtor) return;
    if (typeof window === "undefined") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.WebSocketCtor = require("ws");
      } catch {
        throw new Error(
          "WS client not available on server (missing ws dependency)"
        );
      }
    } else {
      this.WebSocketCtor = (window as any).WebSocket;
    }
  }

  private bindEvent(event: string, handler: (...args: any[]) => void) {
    if (!this.ws) return;
    if (typeof this.ws.addEventListener === "function") {
      this.ws.addEventListener(event, handler as any);
    } else if (typeof this.ws.on === "function") {
      this.ws.on(event, handler);
    }
  }

  private readonly handleOpen = () => {
    this.reconnectAttempts = 0;
    this.updateStatus("connected");
    // 重新发送订阅
    for (const sub of this.subscriptions) {
      this.sendSubscription(sub);
    }
  };

  private readonly handleMessage = (event: any) => {
    try {
      const data =
        typeof event?.data === "string"
          ? event.data
          : typeof event === "string"
          ? event
          : event?.toString?.() ?? "";
      if (!data) return;
      const msg = JSON.parse(data);
      this.opts.onMessage?.(msg as WsMessage);
    } catch (err) {
      this.opts.onError?.(err);
    }
  };

  private readonly handleError = (err: any) => {
    this.opts.onError?.(err);
  };

  private readonly handleClose = (code: number, reason: any) => {
    const reasonStr =
      typeof reason === "string"
        ? reason
        : reason?.toString?.() ?? "connection_closed";
    const byUser = !this.shouldReconnect || !this.opts.autoReconnect;
    this.opts.onClose?.({ code, reason: reasonStr, byUser });

    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (!this.opts.autoReconnect || !this.shouldReconnect) {
      this.updateStatus("closed");
      return;
    }

    this.scheduleReconnect();
  };

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectAttempts += 1;
    const base = this.opts.reconnectBaseMs ?? DEFAULT_RECONNECT_BASE_MS;
    const max = this.opts.maxReconnectIntervalMs ?? DEFAULT_RECONNECT_MAX_MS;
    const delay = Math.min(base * 2 ** (this.reconnectAttempts - 1), max);
    this.updateStatus("reconnecting", this.reconnectAttempts);
    this.reconnectTimer = setTimeout(() => {
      void this.open(true);
    }, delay);
  }

  private sendSubscription(sub: Subscription) {
    if (!this.ws) return;
    const readyState = this.ws.readyState;
    const OPEN =
      typeof this.WebSocketCtor?.OPEN === "number"
        ? this.WebSocketCtor.OPEN
        : 1;
    if (readyState !== OPEN) return;
    try {
      this.ws.send(
        JSON.stringify({
          type: sub.feed,
          ...sub.payload,
        })
      );
    } catch (err) {
      this.opts.onError?.(err);
    }
  }

  private updateStatus(next: WsStatus, attempt?: number) {
    this.status = next;
    this.opts.onStatusChange?.(next, attempt);
  }
}

export default PolymarketWSClient;
