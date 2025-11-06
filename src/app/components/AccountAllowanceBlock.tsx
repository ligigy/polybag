'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { API_KEY_CHANGED_EVENT, hasStoredApiKey } from '@/lib/storage/apiKeyStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ApiKeyManager from '@/app/components/ApiKeyManager';

interface Snapshot {
  balance: {
    usdc: number;
    allowance?: number;
    outcomeYes?: number;
    outcomeNo?: number;
  };
  openOrders?: { id: string; status: string }[];
  lastUpdated: number;
}

function useApiKeyPresence() {
  const [hasKey, setHasKey] = React.useState<boolean>(false);
  React.useEffect(() => {
    setHasKey(hasStoredApiKey());
    if (typeof window === 'undefined') return;
    const handler = () => setHasKey(hasStoredApiKey());
    window.addEventListener(API_KEY_CHANGED_EVENT, handler);
    return () => window.removeEventListener(API_KEY_CHANGED_EVENT, handler);
  }, []);
  return hasKey;
}

export default function AccountAllowanceBlock() {
  const hasApiKey = useApiKeyPresence();
  const [loading, setLoading] = React.useState(true);
  const [snapshot, setSnapshot] = React.useState<Snapshot | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account/snapshot', { cache: 'no-store' });
      const data = await res.json();
      console.log('snapshot', data);
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

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">账户概览</CardTitle>
        <div className="flex items-center gap-2">
          <Badge
            variant={hasApiKey ? 'default' : 'outline'}
            className={hasApiKey ? 'bg-green-100 text-green-700 hover:bg-green-100 py-1' : 'py-1'}
          >
            API Key {hasApiKey ? '已设置' : '未设置'}
          </Badge>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            刷新
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">管理 API Key</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>API Key 管理</DialogTitle>
              </DialogHeader>
              <ApiKeyManager />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : error ? (
          <div className="text-red-600">加载失败：{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500">USDC 余额</span>
                <span className="font-medium">{snapshot?.balance?.usdc ?? '-'}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
