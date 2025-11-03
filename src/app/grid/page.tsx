"use client";
import React from "react";
import AccountStatusPanel from "@/app/components/AccountStatusPanel";
import WalletConnectButton from "@/app/components/WalletConnectButton";
import EventViewer, { MarketItem } from "@/app/components/EventViewer";
import OrderBookView from "@/app/components/OrderBookView";
import GridConfigForm from "@/app/components/GridConfigForm";
import StrategyStatusPanel from "@/app/components/StrategyStatusPanel";
import TestOrderButton from "@/app/components/TestOrderButton";
import { Button } from "@/app/components/ui/button";

export default function GridPage() {
  const [market, setMarket] = React.useState<MarketItem | null>(null);
  const [outcome, setOutcome] = React.useState<"YES" | "NO">("YES");
  const tokenID = market
    ? outcome === "YES"
      ? market.tokenIdYes || market.id
      : market.tokenIdNo || market.id
    : "";
  const strategyId = market ? `${market.id}-${outcome}` : "";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">网格策略</h1>
        <WalletConnectButton />
      </div>

      <AccountStatusPanel />

      <EventViewer
        onSelectMarket={(m, o) => {
          setMarket(m);
          setOutcome(o);
        }}
      />

      {market && tokenID && (
        <div className="space-y-4">
          <OrderBookView tokenID={tokenID} />
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-600">
              最小变动价位 tickSize: {market.tickSize ?? "-"}
            </span>
            <TestOrderButton tokenID={tokenID} side={"BUY"} />
          </div>
          <GridConfigForm
            marketId={market.id}
            tokenID={tokenID}
            outcome={outcome}
            onSaved={() => {
              /* no-op */
            }}
          />
          <div className="flex items-center gap-2">
            <Button
              onClick={async () => {
                if (!strategyId) return;
                await fetch(
                  `/api/strategy/${encodeURIComponent(strategyId)}/start`,
                  { method: "POST" }
                );
              }}
            >
              启动策略
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!strategyId) return;
                await fetch(
                  `/api/strategy/${encodeURIComponent(strategyId)}/stop`,
                  { method: "POST" }
                );
              }}
            >
              停止策略
            </Button>
          </div>
          <StrategyStatusPanel id={strategyId} />
        </div>
      )}
    </div>
  );
}
