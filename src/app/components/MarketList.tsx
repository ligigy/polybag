'use client';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
  selectedOutcome?: 'YES' | 'NO';
  onSelect: (market: MarketSummary, outcome: 'YES' | 'NO') => void;
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
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="max-h-80 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800">
        {markets.map((m) => {
          const yesActive = selectedId === m.id && selectedOutcome === 'YES';
          const noActive = selectedId === m.id && selectedOutcome === 'NO';
          const isActive = selectedId === m.id;
          return (
            <div
              key={m.id}
              className={cn(
                'flex flex-col gap-2 p-3 transition-colors duration-150 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50',
                isActive && 'bg-zinc-100/80 dark:bg-zinc-900/60'
              )}
            >
              <div className="flex flex-col gap-1">
                <div className="text-sm font-semibold leading-tight">
                  {m.question || m.slug || m.id}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  {m.status && <Badge variant="outline">{m.status}</Badge>}
                  {m.tickSize != null && <span>tickSize: {m.tickSize}</span>}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={yesActive ? 'default' : 'outline'}
                    onClick={() => onSelect(m, 'YES')}
                    disabled={!m.yesTokenId}
                  >
                    选择 YES
                  </Button>
                  <Button
                    size="sm"
                    variant={noActive ? 'default' : 'outline'}
                    onClick={() => onSelect(m, 'NO')}
                    disabled={!m.noTokenId}
                  >
                    选择 NO
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
