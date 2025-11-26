'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ensureTypedDataCompatibility } from '@/lib/wallet/signTypedData';
import { getStoredApiKey } from '@/lib/storage/apiKeyStore';
import {
  checkBalanceAllowance,
  approveUSDC,
  notifyPolymarketAllowanceUpdate,
  formatAllowance,
} from '@/lib/polymarket/approval';

export default function ApprovalStatus() {
  const { notify } = useToast();
  const [balance, setBalance] = React.useState<number>(0);
  const [allowance, setAllowance] = React.useState<number>(0);
  const [checking, setChecking] = React.useState(false);
  const [approving, setApproving] = React.useState(false);

  // 检查授权状态（使用 ClobClient API）
  const checkStatus = React.useCallback(async () => {
    setChecking(true);
    try {
      const creds = getStoredApiKey();
      if (!creds) throw new Error('未找到 API Key，请先派生');

      const { providers } = await import('ethers');
      const { ClobClient } = await import('@polymarket/clob-client');

      const eth: any = (window as any).ethereum;
      if (!eth) throw new Error('未检测到浏览器钱包');

      const provider = new providers.Web3Provider(eth);
      const signerV5 = provider.getSigner();
      const signer: any = ensureTypedDataCompatibility(signerV5 as any);

      const funderAddress = await signer.getAddress();
      const apiUrl = process.env.NEXT_PUBLIC_CLOB_API_URL || 'https://clob.polymarket.com';
      const chain = Number(process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || 137);

      // 创建 EOA 模式客户端
      const client = new ClobClient(apiUrl, chain, signer, creds, 0, funderAddress);

      // 获取余额和授权状态
      const info = await checkBalanceAllowance(client, chain);

      console.log('💰 余额&授权:', info);

      setBalance(info.balance);
      setAllowance(info.allowance);
    } catch (error: any) {
      console.error('检查授权状态失败:', error);
      notify(`检查失败：${error?.message || '未知错误'}`);
    } finally {
      setChecking(false);
    }
  }, [notify]);

  // 执行授权（直接调用 USDC 合约）
  const handleApprove = async () => {
    setApproving(true);
    try {
      const creds = getStoredApiKey();
      if (!creds) throw new Error('未找到 API Key，请先派生');

      const { providers } = await import('ethers');
      const { ClobClient } = await import('@polymarket/clob-client');

      const eth: any = (window as any).ethereum;
      if (!eth) throw new Error('未检测到浏览器钱包');

      const provider = new providers.Web3Provider(eth);
      const signerV5 = provider.getSigner();
      const signer: any = ensureTypedDataCompatibility(signerV5 as any);

      const chain = Number(process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || 137);

      // 执行链上授权
      const approvalResult = await approveUSDC(signer, chain, notify);

      if (!approvalResult.success) {
        notify(`授权失败：${approvalResult.error}`);
        return;
      }

      // 通知 Polymarket 服务器更新授权状态
      const funderAddress = await signer.getAddress();
      const apiUrl = process.env.NEXT_PUBLIC_CLOB_API_URL || 'https://clob.polymarket.com';
      const client = new ClobClient(apiUrl, chain, signer, creds, 0, funderAddress);

      const updateResult = await notifyPolymarketAllowanceUpdate(client, notify);

      if (!updateResult.success) {
        notify('链上授权成功，但服务器更新失败，请手动刷新');
      }

      // 等待 2 秒后刷新状态
      setTimeout(() => {
        checkStatus();
      }, 2000);
    } catch (error: any) {
      console.error('授权失败:', error);
      const errorMsg = error?.response?.data?.error || error?.message || '未知错误';
      notify(`授权失败：${errorMsg}`);
    } finally {
      setApproving(false);
    }
  };

  // 组件挂载时检查状态
  React.useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const needsApproval = allowance === 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-xs text-zinc-500">USDC 余额</div>
          <div className="text-lg font-semibold">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : `${balance.toFixed(2)}`}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-zinc-500">已授权额度</div>
          <div className="text-lg font-semibold flex items-center gap-2">
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {formatAllowance(allowance)}
                {needsApproval ? (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {needsApproval && (
        <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-md">
          ⚠️ 需要授权才能下单
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={checkStatus} disabled={checking}>
          {checking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          刷新状态
        </Button>
        <Button size="sm" onClick={handleApprove} disabled={approving || !needsApproval}>
          {approving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {needsApproval ? '立即授权' : '已授权'}
        </Button>
      </div>

      <div className="text-xs text-zinc-400">
        <p>💡 提示：</p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>首次使用需要授权 USDC 给交易合约</li>
          <li>授权只需要进行一次</li>
          <li>授权后可以无限次交易（直到余额用完）</li>
        </ul>
      </div>
    </div>
  );
}
