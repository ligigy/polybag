'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { getStoredApiKey } from '@/lib/storage/apiKeyStore';
import { ensureTypedDataCompatibility } from '@/lib/wallet/signTypedData';
import { Outcome } from '@/services/polymarket/types';
import { checkAllowanceStatus, type AllowanceStatus } from '@/services/polymarket/allowance';
import ApprovalStatus from './ApprovalStatus';

export default function TestOrderButton({ tokenID, side }: { tokenID: string; side: Outcome }) {
  const { notify } = useToast();
  const [busy, setBusy] = React.useState(false);
  const [amount, setAmount] = React.useState(5); // USDC amount for market order
  const [allowanceStatus, setAllowanceStatus] = React.useState<AllowanceStatus | null>(null);
  const [showApproval, setShowApproval] = React.useState(false);

  // 检查是否可以下单
  const canPlaceOrder = React.useMemo(() => {
    if (!allowanceStatus) return false;
    return !allowanceStatus.needsApproval;
  }, [allowanceStatus]);

  async function placeTestOrder() {
    // 下单前再次检查授权
    if (allowanceStatus?.needsApproval) {
      notify('请先完成授权');
      setShowApproval(true);
      return;
    }

    setBusy(true);
    try {
      const creds = getStoredApiKey();
      if (!creds) throw new Error('未找到会话 API Key，请先在首页派生');
      const apiUrl = process.env.NEXT_PUBLIC_CLOB_API_URL || 'https://clob.polymarket.com';
      const chain = Number(process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || 137);
      const { ClobClient, OrderType, Side } = await import('@polymarket/clob-client');
      const { BrowserProvider } = await import('ethers');
      const eth: any = (window as any).ethereum;
      if (!eth) throw new Error('未检测到浏览器钱包');
      const provider = new BrowserProvider(eth);
      const signerV6 = await provider.getSigner();
      const signer: any = ensureTypedDataCompatibility(signerV6 as any);
      const client = new ClobClient(apiUrl, chain, signer, creds);

      // 再次检查授权状态
      const currentStatus = await checkAllowanceStatus(signer, chain);
      if (currentStatus.needsApproval) {
        notify('授权状态已过期，请重新授权');
        setAllowanceStatus(currentStatus);
        setShowApproval(true);
        return;
      }

      const order = await client.createMarketOrder({
        tokenID,
        amount,
        side: side === 'YES' ? Side.BUY : Side.SELL,
        orderType: OrderType.FOK,
      });
      const resp = await client.postOrder(order, OrderType.FOK);
      notify('下单成功！');
      console.log('Order response', resp);
    } catch (e: any) {
      console.error('[CLOB Client] request error', e);
      const errorMsg = e?.response?.data?.error || e?.message || '未知错误';

      // 如果是授权错误，显示授权面板
      if (errorMsg.includes('allowance') || errorMsg.includes('balance')) {
        notify(`下单失败：${errorMsg}。请检查授权状态。`);
        setShowApproval(true);
      } else {
        notify(`下单失败：${errorMsg}`);
      }
    } finally {
      setBusy(false);
    }
  }

  const handleStatusChange = React.useCallback((status: AllowanceStatus | null) => {
    setAllowanceStatus(status);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          className="w-24"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value || '1'))}
        />
        <Button disabled={busy || !canPlaceOrder} onClick={placeTestOrder}>
          测试下单（{side}/{amount} USDC）
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowApproval(!showApproval)}>
          {showApproval ? '隐藏' : '显示'}授权
        </Button>
      </div>

      {/* 授权状态提示 */}
      {allowanceStatus?.needsApproval && !showApproval && (
        <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-md">
          ⚠️ 需要授权才能下单，请点击&ldquo;显示授权&rdquo;按钮
        </div>
      )}

      {/* 授权面板 */}
      {showApproval && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">授权状态</h3>
          <ApprovalStatus onStatusChange={handleStatusChange} />
        </div>
      )}
    </div>
  );
}
