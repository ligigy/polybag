import { NextRequest } from "next/server";
import AccountService from "@/services/polymarket/account";

const MAX_CACHE_MS = 10_000;

const healthCache = new Map<string, { data: unknown; ts: number }>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address") || undefined;
  const cacheKey = address ?? "__default__";
  const now = Date.now();
  const cached = healthCache.get(cacheKey);
  if (cached && now - cached.ts < MAX_CACHE_MS) {
    return Response.json(cached.data);
  }
  const svc = new AccountService();
  try {
    const health = await svc.getAccountHealth({ address });
    healthCache.set(cacheKey, { data: health, ts: now });
    return Response.json(health);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const fallback = {
      apiKeyValid: null,
      wsConnected: null,
      wsStatus: "closed",
      rateLimitErrors: 0,
      notes: [message],
      checkedAt: Date.now(),
    };
    return Response.json(fallback, { status: 502 });
  }
}
