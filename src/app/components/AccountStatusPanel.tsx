"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

type Snapshot = {
  usdc: number;
  allowanceUsdcToExchange?: number;
  openOrders?: number;
  lastUpdated: number;
};

type ApiCreds = { key: string; secret: string; passphrase: string };
const STORAGE_KEY = "polymarket_apikey_session";

function useApiKeyPresence() {
  const [hasKey, setHasKey] = React.useState<boolean>(false);
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      setHasKey(!!raw);
    } catch {
      setHasKey(false);
    }
  }, []);
  return hasKey;
}

export default function AccountStatusPanel() {
  const [snap, setSnap] = React.useState<Snapshot | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const hasApiKey = useApiKeyPresence();

  React.useEffect(() => {
    let alive = true;
    fetch("/api/account/snapshot")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setSnap(d);
      })
      .catch((e) => {
        if (alive) setErr(e?.message || "加载失败");
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="font-medium">账户状态</CardTitle>
        <Button asChild variant="link">
          <a href="/apikey">管理 API Key</a>
        </Button>
      </CardHeader>
      <CardContent>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span>USDC 余额</span>
            <span>{snap?.usdc ?? "-"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>USDC Allowance</span>
            <span>{snap?.allowanceUsdcToExchange ?? "-"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>开放订单数</span>
            <span>{snap?.openOrders ?? "-"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>API Key</span>
            <span className={hasApiKey ? "text-green-600" : "text-red-600"}>
              {hasApiKey ? "已存在(本会话)" : "未设置"}
            </span>
          </div>
        </div>
        <div className="text-xs text-zinc-500">
          更新于：
          {snap?.lastUpdated
            ? new Date(snap.lastUpdated).toLocaleString()
            : "-"}
        </div>
      </CardContent>
    </Card>
  );
}
