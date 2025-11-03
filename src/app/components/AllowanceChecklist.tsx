"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useAccount, useWriteContract } from "wagmi";
import type { Abi } from "viem";

interface Snapshot {
  balance: {
    usdc: number;
    allowance?: number;
    outcomeYes?: number;
    outcomeNo?: number;
  };
  lastUpdated: number;
}

type ChecklistItem = {
  label: string;
  ok: boolean;
  action?: () => Promise<void> | void;
  actionLabel?: string;
};

const APPROVE_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const satisfies Abi;

const MAX_ALLOWANCE = (BigInt(1) << BigInt(256)) - BigInt(1);

export default function AllowanceChecklist() {
  const { notify } = useToast();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = React.useState(true);
  const [snapshot, setSnapshot] = React.useState<Snapshot | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [approving, setApproving] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/snapshot", { cache: "no-store" });
      const data = await res.json();
      if (data?.error) {
        setError(data.error);
        setSnapshot(null);
      } else {
        setSnapshot(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function approveUsdc() {
    const token = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS;
    const spender = process.env.NEXT_PUBLIC_EXCHANGE_ADDRESS;
    if (!token || !spender) {
      notify("请在 .env 中配置 `NEXT_PUBLIC_USDC_TOKEN_ADDRESS` 与 `NEXT_PUBLIC_EXCHANGE_ADDRESS`");
      return;
    }
    if (!address) {
      notify("请先连接钱包");
      return;
    }
    try {
      setApproving(true);
      await writeContractAsync({
        address: token as `0x${string}`,
        abi: APPROVE_ABI,
        functionName: "approve",
        args: [spender as `0x${string}`, MAX_ALLOWANCE],
      });
      notify("授权交易已提交，请在链上确认");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      notify(`授权失败：${message}`);
    } finally {
      setApproving(false);
    }
  }

  const items: ChecklistItem[] = snapshot
    ? [
        {
          label: "USDC 余额足够",
          ok: (snapshot.balance.usdc ?? 0) > 0,
        },
        {
          label: "USDC Allowance > 0",
          ok: (snapshot.balance.allowance ?? 0) > 0,
          action: approveUsdc,
          actionLabel: "Approve USDC",
        },
      ]
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Allowance 检查</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading || approving}
        >
          刷新
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : error ? (
          <div className="text-sm text-red-600">检查失败：{error}</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <label className="flex items-center gap-3">
                  <Checkbox checked={item.ok} readOnly />
                  <span>{item.label}</span>
                </label>
                {!item.ok && item.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => item.action?.()}
                    disabled={approving}
                  >
                    {approving ? "授权中" : item.actionLabel ?? "操作"}
                  </Button>
                )}
              </div>
            ))}
            <div className="text-xs text-zinc-500">
              快照时间：
              {snapshot?.lastUpdated
                ? new Date(snapshot.lastUpdated).toLocaleString()
                : "-"}
            </div>
          </div>
        )}
        <div className="text-xs text-zinc-500">
          若 Allowance 不足，可在钱包中执行授权后点击刷新。
        </div>
      </CardContent>
    </Card>
  );
}
