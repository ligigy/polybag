// WebSocket client skeleton for Polymarket feeds
// Wraps market and user feeds with reconnection + initial_dump handling (to be implemented)

export type FeedType = 'market' | 'user';

export interface MarketSubscription {
  markets?: string[];     // condition_ids
  assets_ids?: string[];  // tokenIDs (YES/NO)
  initial_dump?: boolean;
}

export interface UserAuth { apiKey: string; secret: string; passphrase: string }

export interface UserSubscription extends MarketSubscription { auth: UserAuth }

export interface WsMessage { type: string; [k: string]: any }

export interface WsClientOptions {
  url: string;            // e.g. wss://.../ws/market or /ws/user
  pingIntervalMs?: number;
  onMessage?: (msg: WsMessage) => void;
  onError?: (err: unknown) => void;
  onClose?: (code: number, reason: string) => void;
}

export class PolymarketWSClient {
  private opts: WsClientOptions;
  private ws: any | null = null;
  private WebSocketCtor: any | null = null;
  private pingTimer: any | null = null;

  constructor(opts: WsClientOptions) { this.opts = opts }

  async connect(): Promise<void> {
    if (typeof window === 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.WebSocketCtor = require('ws');
      } catch {
        throw new Error('WS client not available on server (missing ws dependency)');
      }
    } else {
      this.WebSocketCtor = (window as any).WebSocket;
    }
    this.ws = new this.WebSocketCtor(this.opts.url);
    this.ws.on('message', (data: any) => {
      try {
        const msg = typeof data === 'string' ? JSON.parse(data) : JSON.parse(data.toString());
        this.opts.onMessage?.(msg as WsMessage);
      } catch (e) {
        this.opts.onError?.(e);
      }
    });
    this.ws.on('error', (err: any) => this.opts.onError?.(err));
    this.ws.on('close', (code: number, reason: any) => this.opts.onClose?.(code, String(reason || '')));

    // ping (server expects PING to keep-alive)
    const interval = this.opts.pingIntervalMs ?? 50000;
    this.pingTimer = setInterval(() => {
      try { this.ws?.send('PING'); } catch {}
    }, interval);
  }

  async subscribe(feed: FeedType, payload: MarketSubscription | UserSubscription): Promise<void> {
    if (!this.ws) throw new Error('ws not connected');
    const body: any = { type: feed, initial_dump: true, markets: [], assets_ids: [], ...(payload as any) };
    this.ws.send(JSON.stringify(body));
  }

  async close(): Promise<void> {
    if (this.pingTimer) clearInterval(this.pingTimer);
    try { this.ws?.close(); } catch {}
    this.ws = null;
  }
}

export default PolymarketWSClient;
