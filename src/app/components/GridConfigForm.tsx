"use client";
import React from "react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

export default function GridConfigForm({
  marketId,
  tokenID,
  outcome,
  onSaved,
}: {
  marketId: string;
  tokenID: string;
  outcome: "YES" | "NO";
  onSaved?: (id: string) => void;
}) {
  const [priceMin, setPriceMin] = React.useState(0.3);
  const [priceMax, setPriceMax] = React.useState(0.7);
  const [step, setStep] = React.useState(0.02);
  const [sizePerLevel, setSize] = React.useState(100);
  const [budget, setBudget] = React.useState(1000);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
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
              outcome,
              priceMin,
              priceMax,
              step,
              sizePerLevel,
              budget,
              orderType: "GTC",
              refillMode: "ON_FILL",
            },
          }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "保存失败");
      onSaved?.(id);
    } catch (e: any) {
      setError(e?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-2">
      <h3 className="font-medium">网格配置</h3>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-2 gap-3 text-sm items-center">
        <label className="flex items-center gap-2">
          区间下限
          <Input
            className="w-24"
            type="number"
            step="0.001"
            value={priceMin}
            onChange={(e) => setPriceMin(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2">
          区间上限
          <Input
            className="w-24"
            type="number"
            step="0.001"
            value={priceMax}
            onChange={(e) => setPriceMax(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2">
          步长
          <Input
            className="w-24"
            type="number"
            step="0.001"
            value={step}
            onChange={(e) => setStep(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2">
          每格数量
          <Input
            className="w-24"
            type="number"
            step="1"
            value={sizePerLevel}
            onChange={(e) => setSize(parseInt(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2">
          预算(USDC)
          <Input
            className="w-24"
            type="number"
            step="1"
            value={budget}
            onChange={(e) => setBudget(parseInt(e.target.value))}
          />
        </label>
      </div>
      <div>
        <Button disabled={saving} onClick={submit}>
          保存配置
        </Button>
      </div>
    </div>
  );
}
