"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { useToast } from "@/app/components/ui/toast";

type Outcome = "YES" | "NO";
export interface MarketItem {
  id: string;
  conditionId?: string;
  yesTokenId?: string;
  noTokenId?: string;
  tokenIdYes?: string;
  tokenIdNo?: string;
  tickSize?: number;
  status?: string;
  question?: string;
  slug?: string;
}

export default function EventViewer({
  onSelectMarket,
}: {
  onSelectMarket: (m: MarketItem, outcome: Outcome) => void;
}) {
  const { notify } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const [slug, setSlug] = React.useState(params.get("slug") || "");
  const [eventData, setEventData] = React.useState<any | null>(null);
  const [markets, setMarkets] = React.useState<MarketItem[]>([]);
  const [loadingEvent, setLoadingEvent] = React.useState(false);
  const [loadingMarkets, setLoadingMarkets] = React.useState(false);

  async function fetchEventAndMarkets(s: string) {
    const usp = new URLSearchParams(Array.from(params.entries()));
    usp.set("slug", s);
    router.replace(`?${usp.toString()}`);
    // fetch event
    setLoadingEvent(true);
    try {
      const er = await fetch(`/api/event?slug=${encodeURIComponent(s)}`);
      const ed = await er.json();
      if (ed?.error) notify(`加载事件失败：${ed.error}`);
      setEventData(ed || null);
      // derive event id
      const eid = ed?.id || ed?.event?.id || ed?.data?.id;
      if (eid) {
        setLoadingMarkets(true);
        const mr = await fetch(
          `/api/markets?eventId=${encodeURIComponent(String(eid))}&closed=false`
        );
        const md = await mr.json();
        const arr: MarketItem[] = Array.isArray(md?.data) ? md.data : [];
        setMarkets(arr);
      } else {
        setMarkets([]);
      }
    } catch (e: any) {
      notify(`加载失败：${e?.message || ""}`);
    } finally {
      setLoadingEvent(false);
      setLoadingMarkets(false);
    }
  }

  React.useEffect(() => {
    const s = params.get("slug");
    if (s) fetchEventAndMarkets(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickMarket(m: MarketItem, outcome: Outcome) {
    const usp = new URLSearchParams(Array.from(params.entries()));
    usp.set("marketId", m.id);
    usp.set("outcome", outcome);
    router.replace(`?${usp.toString()}`);
    onSelectMarket(m, outcome);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <CardTitle>事件查询</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Input
            placeholder="输入事件 slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <Button
            onClick={() => slug.trim() && fetchEventAndMarkets(slug.trim())}
          >
            查询
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>事件详情</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEvent ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : eventData ? (
            <div className="text-sm text-zinc-700 dark:text-zinc-300 space-y-2">
              <div><span className="font-medium">标题：</span>{eventData.title || eventData.name || '-'}</div>
              <div><span className="font-medium">Slug：</span><code className="break-all">{eventData.slug || '-'}</code></div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-medium">开始时间：</span>{formatDate(eventData.startDate || eventData.createdAt)}</div>
                <div><span className="font-medium">结束时间：</span>{formatDate(eventData.endDate)}</div>
                <div><span className="font-medium">活跃：</span>{String(eventData.active ?? '-')}</div>
                <div><span className="font-medium">已关闭：</span>{String(eventData.closed ?? '-')}</div>
              </div>
              <div>
                <span className="font-medium">描述：</span>
                <div className="mt-1 whitespace-pre-wrap text-xs bg-zinc-50 dark:bg-zinc-900/30 p-2 rounded">
                  {eventData.description || '-'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-zinc-500">请输入 slug 进行查询</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>关联 Markets</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMarkets ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : markets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {markets.map((m) => {
                const clob = (m as any).clobTokenIds || (m as any).clob_token_ids;
                let arr: string[] = [];
                if (Array.isArray(clob)) arr = clob as string[];
                else if (typeof clob === 'string') { try { arr = JSON.parse(clob) } catch {} }
                const yes = (m as any).yesTokenId || m.tokenIdYes || arr[0];
                const no = (m as any).noTokenId || m.tokenIdNo || arr[1];
                const tick = (m as any).tickSize;
                const ques = (m as any).question || m.slug || m.id;
                return (
                  <Card key={m.id} className="cursor-pointer" onClick={() => pickMarket({ ...m, tokenIdYes: yes, tokenIdNo: no } as any, 'YES')}>
                    <CardHeader>
                      <CardTitle className="text-base">{ques}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-zinc-600 space-y-1">
                        <div>
                          id: <code className="break-all">{m.id}</code>
                        </div>
                        <div>
                          conditionId:{" "}
                          <code className="break-all">
                            {m.conditionId || "-"}
                          </code>
                        </div>
                        <div>tickSize: {tick ?? "-"}</div>
                        <div>
                          YES: <code className="break-all">{yes || '-'}</code>
                        </div>
                        <div>
                          NO: <code className="break-all">{no || '-'}</code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-zinc-500">暂无关联 markets</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(s?: string) {
  if (!s) return '-';
  try { return new Date(s).toLocaleString(); } catch { return s; }
}
