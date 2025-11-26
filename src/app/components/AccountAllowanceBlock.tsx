'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { API_KEY_CHANGED_EVENT, hasStoredApiKey, getStoredApiKey } from '@/lib/storage/apiKeyStore';
import { ensureTypedDataCompatibility } from '@/lib/wallet/signTypedData';
import {
  getAccountSnapshot,
  getProxyWalletBalance,
  type ProxyWalletBalance,
} from '@/services/polymarket/account-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ApiKeyManager from '@/app/components/ApiKeyManager';

// 你的 Polymarket Proxy 钱包地址
export const PROXY_WALLET_ADDRESS = '0xd1A720882b518c7899828580D38ece53382758A9';

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
  const [proxyBalance, setProxyBalance] = React.useState<ProxyWalletBalance | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const creds = getStoredApiKey();
      if (!creds) {
        throw new Error('未找到 API Key，请先设置');
      }

      // 获取前端钱包 signer
      const { providers } = await import('ethers');
      const eth: any = (window as any).ethereum;
      if (!eth) {
        throw new Error('未检测到浏览器钱包');
      }

      const provider = new providers.Web3Provider(eth);
      const signerV5 = provider.getSigner();
      console.log('signerV5', signerV5);
      const signer = ensureTypedDataCompatibility(signerV5 as any);

      // 转换为 ApiCredentials 格式
      const apiCredentials = {
        apiKey: creds.key,
        secret: creds.secret,
        passphrase: creds.passphrase,
      };

      console.log('apiCredentials', apiCredentials);

      // 直接在客户端调用
      const data = await getAccountSnapshot(signer, apiCredentials);
      console.log('snapshot', data);

      // 获取 Proxy 钱包余额
      const proxyData = await getProxyWalletBalance(signer, PROXY_WALLET_ADDRESS);
      console.log('proxy balance', proxyData);
      setProxyBalance(proxyData);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setProxyBalance(null);
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
              <Button variant="outline" size="sm">
                管理 API Key
              </Button>
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
                <span className="text-xs text-zinc-500">钱包 USDC</span>
                <span className="font-medium">{proxyBalance?.walletBalance.toFixed(2) ?? '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500">已 Deposit USDC</span>
                <span className="font-medium text-green-600">
                  {proxyBalance?.proxyBalance.toFixed(2) ?? '-'}
                </span>
              </div>
            </div>
            <div className="text-xs text-zinc-400 pt-2">
              <div>
                Proxy 地址: {PROXY_WALLET_ADDRESS.slice(0, 6)}...{PROXY_WALLET_ADDRESS.slice(-4)}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
