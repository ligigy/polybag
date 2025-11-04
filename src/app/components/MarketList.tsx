"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export interface MarketSummary {
  id: string;
  question: string;
  slug?: string;
  conditionId?: string;
  yesTokenId?: string;
  noTokenId?: string;
  tickSize?: number;
  status?: string;
}

interface MarketListProps {
  markets: MarketSummary[];
  loading?: boolean;
  selectedId?: string;
  selectedOutcome?: "YES" | "NO";
  onSelect: (market: MarketSummary, outcome: "YES" | "NO") => void;
}

export default function MarketList({
  markets,
  loading,
  selectedId,
  selectedOutcome,
  onSelect,
}: MarketListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!loading && markets.length === 0) {
    return <div className="text-sm text-zinc-500">暂无符合条件的市场。</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {markets.map((m) => {
        const yesActive = selectedId === m.id && selectedOutcome === "YES";
        const noActive = selectedId === m.id && selectedOutcome === "NO";
        return (
          <Card key={m.id} className="border border-zinc-200 dark:border-zinc-800">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base font-semibold">
                {m.question || m.slug || m.id}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                {m.status && <Badge variant="outline">{m.status}</Badge>}
                {m.tickSize != null && <span>tickSize: {m.tickSize}</span>}
                {/* {m.conditionId && (
                  <span>
                    conditionId: <code>{m.conditionId}</code>
                  </span>
                )} */}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-zinc-600">
              {/* <div>
                YES Token: <code className="break-all">{m.yesTokenId || "-"}</code>
              </div>
              <div>
                NO Token: <code className="break-all">{m.noTokenId || "-"}</code>
              </div> */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant={yesActive ? "default" : "outline"}
                  onClick={() => onSelect(m, "YES")}
                  disabled={!m.yesTokenId}
                >
                  选择 YES
                </Button>
                <Button
                  size="sm"
                  variant={noActive ? "default" : "outline"}
                  onClick={() => onSelect(m, "NO")}
                  disabled={!m.noTokenId}
                >
                  选择 NO
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
