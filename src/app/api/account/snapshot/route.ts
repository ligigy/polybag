import { NextRequest } from "next/server";
import AccountService from "@/services/polymarket/account";

export async function GET(req: NextRequest) {
  const svc = new AccountService();
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address") || undefined;
  try {
    const snapshot = await svc.getSnapshot(address);
    return Response.json(snapshot);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message });
  }
}
