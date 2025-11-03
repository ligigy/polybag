import { NextRequest } from "next/server";
import AccountService from "@/services/polymarket/account";

export async function GET(req: NextRequest) {
  const svc = new AccountService();
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address") || undefined;
  try {
    const health = await svc.getAccountHealth({ address });
    return Response.json(health);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({
      apiKeyValid: null,
      wsConnected: null,
      wsStatus: "closed",
      rateLimitErrors: 0,
      notes: [message],
      checkedAt: Date.now(),
    });
  }
}
