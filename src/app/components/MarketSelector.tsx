"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface MarketItem {
  id: string;
  conditionId?: string;
  tokenIdYes?: string;
  tokenIdNo?: string;
  tickSize?: number;
  feeBps?: number;
}

export default function MarketSelector({
  onSelect,
}: {
  onSelect: (m: MarketItem, outcome: "YES" | "NO") => void;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [markets, setMarkets] = React.useState<MarketItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string>("");
  const [outcome, setOutcome] = React.useState<"YES" | "NO">(() =>
    params.get("outcome") === "NO" ? "NO" : "YES"
  );
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>("");

  // 懒加载搜索：≥2字符才请求，300ms 防抖；只取前 20 个后端返回
  React.useEffect(() => {
    let alive = true;
    const q = search.trim();
    if (q.length < 2) { setMarkets([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/markets?q=${encodeURIComponent(q)}&limit=20`)
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          const list: MarketItem[] = Array.isArray(d?.data) ? d.data : [];
          setMarkets(list);
        })
        .catch((e) => { if (alive) setError(e?.message || '加载失败'); })
        .finally(() => { if (alive) setLoading(false); });
    }, 300);
    return () => { alive = false; clearTimeout(t); };
  }, [search]);

  const active = markets.find((m) => m.id === selected);
  const filtered = markets.filter((m) => {
    const hitStatus = !status || (m as any).status === status;
    return hitStatus;
  });

  function applySelection(sel: MarketItem | undefined, out: "YES" | "NO") {
    if (!sel) return;
    const usp = new URLSearchParams(Array.from(params.entries()));
    usp.set("marketId", sel.id);
    usp.set("outcome", out);
    router.replace(`?${usp.toString()}`);
    onSelect(sel, out);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-medium">选择市场</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex items-center gap-2">
          <Input
            placeholder="搜索 question/slug/id"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={status}
            onChange={(e) => setStatus((e.target as HTMLSelectElement).value)}
          >
            <option value="">全部状态</option>
            <option value="TRADING">TRADING</option>
            <option value="SETTLING">SETTLING</option>
          </Select>
        </div>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Select
              className="w-full"
              value={selected}
              onChange={(e) =>
                setSelected((e.target as HTMLSelectElement).value)
              }
            >
              <option value="">请选择市场</option>
              {filtered.map((m) => (
                <option key={m.id} value={m.id}>
                  {(m as any).question || m.slug || m.id}
                  {m.tokenIdYes ? " (Y/N)" : ""}
                </option>
              ))}
            </Select>
            <Select
              value={outcome}
              onChange={(e) =>
                setOutcome(
                  (e.target as HTMLSelectElement).value as "YES" | "NO"
                )
              }
            >
              <option value="YES">YES</option>
              <option value="NO">NO</option>
            </Select>
            <Button
              onClick={() => applySelection(active, outcome)}
              disabled={!active}
            >
              确认
            </Button>
          </div>
        )}
        {active && (
          <div className="text-xs text-zinc-600">
            <div>
              question:{" "}
              <code className="break-all">
                {(active as any).question || "-"}
              </code>
            </div>
            <div>
              slug:{" "}
              <code className="break-all">{(active as any).slug || "-"}</code>
            </div>
            <div>
              conditionId:{" "}
              <code className="break-all">{active.conditionId || "-"}</code>
            </div>
            <div>tickSize: {active.tickSize ?? "-"}</div>
            <div>
              YES token:{" "}
              <code className="break-all">{active.tokenIdYes || "-"}</code>
            </div>
            <div>
              NO token:{" "}
              <code className="break-all">{active.tokenIdNo || "-"}</code>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
