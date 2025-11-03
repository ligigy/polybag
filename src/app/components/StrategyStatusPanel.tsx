"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface StrategyStatus {
  running: boolean;
  state?: {
    startedAt?: number;
    lastHeartbeat?: number;
    plan?: { toCreate?: unknown[]; toCancel?: unknown[] } | null;
    stoppedAt?: number;
  } | null;
  plan?: { toCreate?: unknown[]; toCancel?: unknown[] } | null;
  desired?: unknown;
  updatedAt: number;
  config?: unknown;
}

export default function StrategyStatusPanel({ id }: { id: string }) {
  const [status, setStatus] = React.useState<StrategyStatus | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchStatus = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/strategy/${encodeURIComponent(id)}/status`, {
        cache: "no-store",
      });
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    fetchStatus();
    timer = setInterval(fetchStatus, 7000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [fetchStatus]);

  const lastHeartbeat = status?.state?.lastHeartbeat;
  const planCreate = status?.plan?.toCreate?.length ?? 0;
  const planCancel = status?.plan?.toCancel?.length ?? 0;

  return (
    <Card className="w-full text-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-medium">策略状态</CardTitle>
        <Button size="sm" variant="outline" onClick={fetchStatus} disabled={loading}>
          刷新
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && !status ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            <div>运行: {status?.running ? "是" : "否"}</div>
            <div>
              上次心跳：
              {lastHeartbeat ? new Date(lastHeartbeat).toLocaleString() : "-"}
            </div>
            <div>
              待创建订单：<span className="font-medium">{planCreate}</span>
            </div>
            <div>
              待撤销订单：<span className="font-medium">{planCancel}</span>
            </div>
            <div className="text-xs text-zinc-500">
              更新时间：
              {status?.updatedAt
                ? new Date(status.updatedAt).toLocaleString()
                : "-"}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
