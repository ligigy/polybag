"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  marketId: string;
  tokenID: string;
  outcome: "YES" | "NO";
  onSaved?: (id: string) => void;
}

export default function GridConfigForm({
  marketId,
  tokenID,
  outcome,
  onSaved,
}: Props) {
  const [priceMin, setPriceMin] = React.useState(0.3);
  const [priceMax, setPriceMax] = React.useState(0.7);
  const [step, setStep] = React.useState(0.02);
  const [sizePerLevel, setSize] = React.useState(100);
  const [budget, setBudget] = React.useState(1000);
  const [orderType, setOrderType] = React.useState<"GTC" | "GTD" | "FAK" | "FOK">("GTC");
  const [refillMode, setRefillMode] = React.useState<"ALWAYS" | "ON_FILL" | "NEVER">("ON_FILL");
  const [mode, setMode] = React.useState<"LIVE" | "PAPER" | "BACKTEST">("LIVE");
  const [ttlSeconds, setTtlSeconds] = React.useState(600);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const derived = React.useMemo(() => {
    if (!(priceMax > priceMin) || step <= 0) {
      return { levels: 0, meanPrice: 0, notion: 0, usage: 0 };
    }
    const rawLevels = Math.floor((priceMax - priceMin) / step) + 1;
    const levels = Number.isFinite(rawLevels) && rawLevels > 0 ? rawLevels : 0;
    const meanPrice = (priceMin + priceMax) / 2;
    const notion = levels * sizePerLevel * meanPrice;
    const usage = budget > 0 ? notion / budget : 0;
    return { levels, meanPrice, notion, usage };
  }, [priceMin, priceMax, step, sizePerLevel, budget]);

  function validate(): string | null {
    if (!(priceMax > priceMin)) return "区间上限必须大于下限";
    if (step <= 0) return "步长必须大于 0";
    if (!Number.isFinite(derived.levels) || derived.levels <= 0)
      return "网格层数无效，请检查区间与步长";
    if (sizePerLevel <= 0) return "每格数量必须大于 0";
    if (budget <= 0) return "预算必须大于 0";
    if (orderType === "GTD" && ttlSeconds < 10)
      return "GTD 订单的有效期需 >= 10 秒";
    if (derived.notion > budget) return "预算不足以覆盖网格总成本";
    return null;
  }

  async function submit() {
    const invalidReason = validate();
    if (invalidReason) {
      setError(invalidReason);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const id = `${marketId}-${outcome}`;
      const resp = await fetch(
        `/api/strategy/${encodeURIComponent(id)}/config`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: {
              marketId,
              tokenID,
              outcome,
              priceMin,
              priceMax,
              step,
              sizePerLevel,
              budget,
              orderType,
              refillMode,
              mode,
              ttlSeconds: orderType === "GTD" ? ttlSeconds : undefined,
            },
          }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "保存失败");
      onSaved?.(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-4 rounded-lg border border-zinc-200 p-4 shadow-sm dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">网格配置</h3>
        <span className="text-xs text-zinc-500">市场 {marketId} · {outcome}</span>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 text-sm">
          <label className="flex flex-col gap-1">
            <span>区间下限</span>
            <Input
              type="number"
              step="0.0001"
              value={priceMin}
              onChange={(e) => setPriceMin(parseFloat(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>区间上限</span>
            <Input
              type="number"
              step="0.0001"
              value={priceMax}
              onChange={(e) => setPriceMax(parseFloat(e.target.value))}
            />
          </label>
        </div>
        <div className="space-y-2 text-sm">
          <label className="flex flex-col gap-1">
            <span>步长</span>
            <Input
              type="number"
              step="0.0001"
              value={step}
              onChange={(e) => setStep(parseFloat(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>每格数量（Outcome 数量）</span>
            <Input
              type="number"
              min={1}
              value={sizePerLevel}
              onChange={(e) => setSize(parseFloat(e.target.value))}
            />
          </label>
        </div>
        <div className="space-y-2 text-sm">
          <label className="flex flex-col gap-1">
            <span>预算 (USDC)</span>
            <Input
              type="number"
              min={1}
              value={budget}
              onChange={(e) => setBudget(parseFloat(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>运行模式</span>
            <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择模式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LIVE">LIVE</SelectItem>
                <SelectItem value="PAPER">PAPER</SelectItem>
                <SelectItem value="BACKTEST">BACKTEST</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>订单类型</span>
          <Select value={orderType} onValueChange={(v) => setOrderType(v as typeof orderType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GTC">GTC</SelectItem>
              <SelectItem value="GTD">GTD</SelectItem>
              <SelectItem value="FAK">FAK</SelectItem>
              <SelectItem value="FOK">FOK</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>补挂策略</span>
          <Select value={refillMode} onValueChange={(v) => setRefillMode(v as typeof refillMode)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ON_FILL">成交补挂</SelectItem>
              <SelectItem value="ALWAYS">始终维持</SelectItem>
              <SelectItem value="NEVER">不补挂</SelectItem>
            </SelectContent>
          </Select>
        </label>
        {orderType === "GTD" && (
          <label className="flex flex-col gap-1 text-sm">
            <span>GTD 有效期 (秒)</span>
            <Input
              type="number"
              min={10}
              value={ttlSeconds}
              onChange={(e) => setTtlSeconds(parseInt(e.target.value))}
            />
          </label>
        )}
      </div>

      <div className="grid gap-2 text-sm text-zinc-600">
        <div>
          网格层数：<span className="font-medium">{derived.levels}</span>
        </div>
        <div>
          估算平均价：<span className="font-medium">{derived.meanPrice.toFixed(4)}</span>
        </div>
        <div>
          预计总成本：
          <span className="font-medium">{derived.notion.toFixed(2)} USDC</span>
          {derived.notion > budget && (
            <span className="ml-2 text-red-600">预算不足</span>
          )}
        </div>
        <div>
          预算占用：
          <span className="font-medium">
            {(derived.usage * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button disabled={saving} onClick={submit}>
          {saving ? "保存中..." : "保存配置"}
        </Button>
        <span className="text-xs text-zinc-500">
          tokenID: <code>{tokenID}</code>
        </span>
      </div>
    </div>
  );
}
