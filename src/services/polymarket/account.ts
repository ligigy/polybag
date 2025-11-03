// Account monitoring aggregation skeleton
// Aggregates balance/allowance/open orders/trades and basic health checks

export interface AccountSnapshot {
  address?: string;
  usdc: number;
  allowanceUsdcToCTF?: number;
  allowanceUsdcToExchange?: number;
  ctfApprovedForAll?: boolean;
  outcomeYes?: number;
  outcomeNo?: number;
  openOrders?: number;
  lastUpdated: number;
}

export interface AccountHealth {
  apiKeyValid?: boolean;
  wsConnected?: boolean;
  wsLastPingMs?: number;
  rateLimitErrors?: number;
  clockSkewMs?: number;
  notes?: string[];
}

export class AccountService {
  // In a later pass, inject the clob adapter and ws client
  constructor() {}

  async getSnapshot(): Promise<AccountSnapshot> {
    try {
      const { PolymarketClobAdapter } = await import('@/services/polymarket/clob-adapter');
      // dynamic import default
      // @ts-ignore
      const Adapter = (PolymarketClobAdapter as any) || (await import('@/services/polymarket/clob-adapter')).default;
      const adapter = new Adapter();
      await adapter.init();
      const bal = await adapter.getBalanceAllowance();
      const openOrders = await adapter.getOpenOrders({});
      return {
        usdc: bal.usdc,
        allowanceUsdcToExchange: bal.allowance,
        openOrders: openOrders.length,
        lastUpdated: Date.now(),
      };
    } catch {
      return { usdc: 0, lastUpdated: Date.now() };
    }
  }

  async getHealth(): Promise<AccountHealth> {
    // TODO: compute API key validity, WS state, rate limit stats, clock skew
    return {
      apiKeyValid: undefined,
      wsConnected: undefined,
      rateLimitErrors: 0,
      clockSkewMs: undefined,
      notes: [],
    };
  }
}

export default AccountService;
