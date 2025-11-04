import { NextRequest } from "next/server";
import { listRiskEvents } from "@/lib/persistence/accountLogs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || 50);
  const events = await listRiskEvents(Number.isFinite(limit) ? limit : 50);
  return Response.json({ data: events });
}
