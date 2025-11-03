"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import WalletConnectButton from "@/app/components/WalletConnectButton";
import EventSearchBar from "@/app/components/EventSearchBar";
import MarketDetails from "@/app/components/MarketDetails";
import MarketList, {
  MarketSummary,
} from "@/app/components/MarketList";
import OrderBookView from "@/app/components/OrderBookView";
import GridConfigForm from "@/app/components/GridConfigForm";
import AccountStatusPanel from "@/app/components/AccountStatusPanel";
import StrategyStatusPanel from "@/app/components/StrategyStatusPanel";
import AllowanceChecklist from "@/app/components/AllowanceChecklist";
import TestOrderButton from "@/app/components/TestOrderButton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Outcome = "YES" | "NO";

interface QueryState {
  slug?: string | null;
  marketId?: string | null;
  outcome?: Outcome | null;
}

function useQueryState(): [QueryState, (state: QueryState) => void] {
  const router = useRouter();
  const params = useSearchParams();

  const state: QueryState = {
    slug: params.get("slug"),
    marketId: params.get("marketId"),
    outcome: (params.get("outcome") as Outcome | null) ?? null,
  };

  const update = React.useCallback(
    (next: QueryState) => {
      const usp = new URLSearchParams(Array.from(params.entries()));
      if (next.slug) usp.set("slug", next.slug);
      else usp.delete("slug");
      if (next.marketId) usp.set("marketId", next.marketId);
      else usp.delete("marketId");
      if (next.outcome) usp.set("outcome", next.outcome);
      else usp.delete("outcome");
      router.replace(`?${usp.toString()}`);
    },
    [params, router]
  );

  return [state, update];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export default function GridPage() {
  const { notify } = useToast();
  const [query, setQuery] = useQueryState();
  const [eventData, setEventData] = React.useState<Record<string, unknown> | null>(
    null
  );
  const [markets, setMarkets] = React.useState<MarketSummary[]>([]);
  const [selected, setSelected] = React.useState<{
    market: MarketSummary | null;
    outcome: Outcome;
  }>({ market: null, outcome: "YES" });
  const [loadingEvent, setLoadingEvent] = React.useState(false);
  const [loadingMarkets, setLoadingMarkets] = React.useState(false);

  const tokenID = selected.market
    ? selected.outcome === "YES"
      ? selected.market.yesTokenId || selected.market.id
      : selected.market.noTokenId || selected.market.id
    : "";
  const strategyId = selected.market
    ? `${selected.market.id}-${selected.outcome}`
    : "";

  async function fetchEvent(slug: string) {
    setLoadingEvent(true);
    setEventData(null);
    try {
      const res = await fetch(`/api/event?slug=${encodeURIComponent(slug)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (isRecord(data) && typeof data.error === "string") {
        notify(`事件加载失败：${data.error}`);
        return null;
      }
      if (isRecord(data)) {
        setEventData(data);
        return data;
      }
      setEventData(null);
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      notify(`事件加载失败：${message}`);
      return null;
    } finally {
      setLoadingEvent(false);
    }
  }

  function normalizeMarket(raw: unknown): MarketSummary | null {
    if (!isRecord(raw)) return null;
    const clobTokenIds = raw.clobTokenIds ?? raw.clob_token_ids;
    let tokens: string[] = [];
    if (Array.isArray(clobTokenIds)) tokens = clobTokenIds as string[];
    else if (typeof clobTokenIds === "string") {
      try {
        tokens = JSON.parse(clobTokenIds);
      } catch {
        tokens = [];
      }
    }
    const yesToken =
      (raw.yesTokenId as string | undefined) ||
      (raw.yes_token_id as string | undefined) ||
      (raw.token_id_yes as string | undefined) ||
      tokens[0];
    const noToken =
      (raw.noTokenId as string | undefined) ||
      (raw.no_token_id as string | undefined) ||
      (raw.token_id_no as string | undefined) ||
      tokens[1];
    if (!yesToken || !noToken) return null;
    return {
      id: String(
        (raw.id as string | number | undefined) ||
          (raw.marketId as string | number | undefined) ||
          (raw.market as string | number | undefined) ||
          ""
      ),
      question:
        (raw.question as string | undefined) ||
        (raw.ticker as string | undefined) ||
        (raw.slug as string | undefined) ||
        String(raw.id ?? ""),
      slug: raw.slug as string | undefined,
      conditionId:
        (raw.conditionId as string | undefined) ||
        (raw.condition_id as string | undefined),
      yesTokenId: yesToken,
      noTokenId: noToken,
      tickSize:
        (raw.tickSize as number | undefined) ||
        (raw.tick_size as number | undefined) ||
        (raw.tick_size_str as number | undefined) ||
        (raw.tick as number | undefined) ||
        undefined,
      status: (raw.status as string | undefined) || (raw.state as string | undefined),
    };
  }

  async function fetchMarkets(slug: string) {
    setLoadingMarkets(true);
    try {
      const res = await fetch(
        `/api/markets?slug=${encodeURIComponent(slug)}&closed=false`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (isRecord(data) && typeof data.error === "string") {
        notify(`Markets 加载失败：${data.error}`);
        setMarkets([]);
        return [];
      }
      const arr: MarketSummary[] = (isRecord(data) && Array.isArray(data.data)
        ? data.data
        : [])
        .map(normalizeMarket)
        .filter((m): m is MarketSummary => !!m);
      setMarkets(arr);
      return arr;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      notify(`Markets 加载失败：${message}`);
      setMarkets([]);
      return [];
    } finally {
      setLoadingMarkets(false);
    }
  }

  async function handleSearch(slug: string) {
    setQuery({ slug, marketId: null, outcome: null });
    const event = await fetchEvent(slug);
    if (!event) {
      setMarkets([]);
      setSelected({ market: null, outcome: "YES" });
      return;
    }
    // 直接使用 slug 获取 markets，无需提取 eventId
    const arr = await fetchMarkets(slug);
    if (arr.length > 0) {
      setSelected({ market: arr[0], outcome: "YES" });
      setQuery({ slug, marketId: arr[0].id, outcome: "YES" });
    } else {
      setSelected({ market: null, outcome: "YES" });
      setQuery({ slug, marketId: null, outcome: null });
    }
  }

  React.useEffect(() => {
    if (!query.slug) return;
    (async () => {
      const event = await fetchEvent(query.slug!);
      if (!event) return;
      // 直接使用 slug 获取 markets
      const arr = await fetchMarkets(query.slug!);
      if (arr.length === 0) return;
      const desired = arr.find((m) => m.id === query.marketId) ?? arr[0];
      const desiredOutcome = query.outcome === "NO" ? "NO" : "YES";
      setSelected({ market: desired, outcome: desiredOutcome });
      if (
        query.marketId !== desired.id ||
        query.outcome !== desiredOutcome
      ) {
        setQuery({
          slug: query.slug,
          marketId: desired.id,
          outcome: desiredOutcome,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.slug]);

  const handleSelectMarket = (market: MarketSummary, outcome: Outcome) => {
    setSelected({ market, outcome });
    setQuery({ slug: query.slug || null, marketId: market.id, outcome });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Polymarket 网格策略</h1>
        <WalletConnectButton />
      </div>

      <AccountStatusPanel />
      <AllowanceChecklist />

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <EventSearchBar
            defaultValue={query.slug || ""}
            loading={loadingEvent}
            onSearch={handleSearch}
          />
          <MarketDetails loading={loadingEvent} event={eventData} />
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">关联 Markets</h2>
          <MarketList
            markets={markets}
            loading={loadingMarkets}
            selectedId={selected.market?.id}
            selectedOutcome={selected.outcome}
            onSelect={handleSelectMarket}
          />
        </div>
      </div>

      {selected.market && tokenID ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">订单簿</h2>
            <OrderBookView tokenID={tokenID} />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
              <span>
                当前市场：{selected.market.question} ({selected.outcome})
              </span>
              <span>tickSize: {selected.market.tickSize ?? "-"}</span>
              <TestOrderButton tokenID={tokenID} side={selected.outcome} />
            </div>
            <GridConfigForm
              marketId={selected.market.id}
              tokenID={tokenID}
              outcome={selected.outcome}
              onSaved={() => notify("策略配置已保存")}
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={async () => {
                  if (!strategyId) return;
                  try {
                    const resp = await fetch(
                      `/api/strategy/${encodeURIComponent(strategyId)}/start`,
                      { method: "POST" }
                    );
                    const data = await resp.json();
                    if (data?.error) notify(`启动失败：${data.error}`);
                    else notify("已触发启动");
                  } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    notify(`启动失败：${message}`);
                  }
                }}
              >
                启动策略
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!strategyId) return;
                  try {
                    const resp = await fetch(
                      `/api/strategy/${encodeURIComponent(strategyId)}/stop`,
                      { method: "POST" }
                    );
                    const data = await resp.json();
                    if (data?.error) notify(`停止失败：${data.error}`);
                    else notify("已请求停止");
                  } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    notify(`停止失败：${message}`);
                  }
                }}
              >
                停止策略
              </Button>
            </div>
            <StrategyStatusPanel id={strategyId} />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-48 w-full" />
        </div>
      )}
    </div>
  );
}
