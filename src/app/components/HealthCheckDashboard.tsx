"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface HealthResponse {
  apiKeyValid: boolean | null;
  wsConnected: boolean | null;
  wsStatus: string;
  rateLimitErrors: number;
  clockSkewMs?: number;
  balance?: {
    usdc: number;
    allowance?: number;
  };
  notes: string[];
  checkedAt: number;
}

type EventPayload =
  | { type: "snapshot"; snapshot: unknown }
  | { type: "balance"; balance: unknown; ts: number }
  | { type: "order"; order: unknown; ts: number }
  | { type: "order-removed"; order: unknown; ts: number }
  | { type: "trade"; trade: unknown; ts: number }
  | { type: "error"; error: string; ts: number }
  | { type: "status"; status: unknown }
  | Record<string, unknown>;

interface EventMessage {
  type: string;
  payload: EventPayload;
  ts: number;
}

export default function HealthCheckDashboard({ address }: { address?: string }) {
  const [health, setHealth] = React.useState<HealthResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [events, setEvents] = React.useState<EventMessage[]>([]);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/account/health${
        address ? `?address=${encodeURIComponent(address)}` : ""
      }`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    const url = `/api/account/stream${address ? `?address=${encodeURIComponent(address)}` : ""}`;
    const source = new EventSource(url);
    const handler = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        setEvents((prev) => [{ type: "raw", payload, ts: Date.now() }, ...prev].slice(0, 50));
      } catch (err) {
        console.error(err);
      }
    };
    source.addEventListener("message", handler);
    source.addEventListener("error", () => {
      source.removeEventListener("message", handler);
      source.close();
    });
    return () => {
      source.removeEventListener("message", handler);
      source.close();
    };
  }, [address]);

  const renderStatus = (label: string, value: string | number | boolean | null) => (
    <div className="flex justify-between text-sm">
      <span>{label}</span>
      <span>{String(value ?? "-")}</span>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>账户健康</CardTitle>
        <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
          刷新
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !health ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="space-y-2">
            {renderStatus("API Key 有效", health?.apiKeyValid)}
            {renderStatus("WS 连接", health?.wsConnected)}
            {renderStatus("WS 状态", health?.wsStatus)}
            {renderStatus("RateLimit 错误", health?.rateLimitErrors ?? 0)}
            {renderStatus("时钟偏移(ms)", health?.clockSkewMs ?? "-")}
            {renderStatus("余额 USDC", health?.balance?.usdc ?? "-")}
            {renderStatus("Allowance", health?.balance?.allowance ?? "-")}
            <div className="text-xs text-zinc-500">
              检查时间：
              {health?.checkedAt
                ? new Date(health.checkedAt).toLocaleString()
                : "-"}
            </div>
            {health?.notes?.length ? (
              <div className="text-xs text-zinc-500">
                Notes:
                <ul className="list-disc pl-4">
                  {health.notes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium">最新事件</h4>
          <div className="max-h-40 overflow-auto space-y-1 text-xs text-zinc-600">
            {events.length === 0 ? (
              <div className="text-zinc-500">暂无事件</div>
            ) : (
              events.map((evt, idx) => (
                <div key={idx} className="border-b border-zinc-100 pb-1">
                  <div className="font-semibold">{evt.type}</div>
                  <code className="block break-all bg-zinc-50 p-1">
                    {JSON.stringify(evt.payload)}
                  </code>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
