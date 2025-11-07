'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ensureTypedDataCompatibility } from '@/lib/wallet/signTypedData';
import {
  checkAllowanceStatus,
  approveAllowances,
  formatBalance,
  type AllowanceStatus,
} from '@/services/polymarket/allowance';

interface ApprovalStatusProps {
  onStatusChange?: (status: AllowanceStatus | null) => void;
}

export default function ApprovalStatus({ onStatusChange }: ApprovalStatusProps) {
  const { notify } = useToast();
  const [status, setStatus] = React.useState<AllowanceStatus | null>(null);
  const [checking, setChecking] = React.useState(false);
  const [approving, setApproving] = React.useState(false);

  // 使用 ref 存储 onStatusChange，避免依赖变化导致循环
  const onStatusChangeRef = React.useRef(onStatusChange);
  React.useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  // 检查授权状态
  const checkStatus = React.useCallback(async () => {
    setChecking(true);
    try {
      const { BrowserProvider } = await import('ethers');

      const eth: any = (window as any).ethereum;
      if (!eth) throw new Error('未检测到浏览器钱包');

      const provider = new BrowserProvider(eth);
      const signerV6 = await provider.getSigner();
      const signer: any = ensureTypedDataCompatibility(signerV6 as any);

      const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || 137);
      const allowanceStatus = await checkAllowanceStatus(signer, chainId);

      setStatus(allowanceStatus);
      onStatusChangeRef.current?.(allowanceStatus);
    } catch (error: any) {
      console.error('检查授权状态失败:', error);
      notify(`检查失败：${error?.message || '未知错误'}`);
      setStatus(null);
      onStatusChangeRef.current?.(null);
    } finally {
      setChecking(false);
    }
  }, [notify]);

  // 执行授权
  const handleApprove = async () => {
    setApproving(true);
    try {
      const { BrowserProvider } = await import('ethers');

      const eth: any = (window as any).ethereum;
      if (!eth) throw new Error('未检测到浏览器钱包');

      const provider = new BrowserProvider(eth);
      const signerV6 = await provider.getSigner();
      const signer: any = ensureTypedDataCompatibility(signerV6 as any);

      const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || 137);
      const result = await approveAllowances(signer, chainId);

      if (result.success) {
        notify(`授权成功！已完成 ${result.txHashes?.length || 0} 个交易，请等待确认...`);
        // 等待几秒后重新检查状态
        setTimeout(() => {
          checkStatus();
        }, 3000);
      } else {
        notify(`授权失败：${result.error}`);
      }
    } catch (error: any) {
      console.error('授权失败:', error);
      notify(`授权失败：${error?.message || '未知错误'}`);
    } finally {
      setApproving(false);
    }
  };

  // 初始加载时检查状态
  React.useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  if (checking && !status) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>检查授权状态...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={checkStatus} disabled={checking}>
          重新检查授权
        </Button>
      </div>
    );
  }

  const {
    hasUsdcCtfAllowance,
    hasUsdcExchangeAllowance,
    hasCtfExchangeAllowance,
    usdcBalance,
    needsApproval,
  } = status;

  return (
    <div className="space-y-2">
      {/* 余额信息 */}
      <div className="text-xs text-zinc-600 space-y-1">
        <div>USDC 余额: ${formatBalance(usdcBalance)}</div>
      </div>

      {/* 授权状态 */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          {hasUsdcCtfAllowance ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
          <span className={hasUsdcCtfAllowance ? 'text-green-600' : 'text-amber-600'}>
            USDC → CTF {hasUsdcCtfAllowance ? '已授权' : '待授权'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {hasUsdcExchangeAllowance ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
          <span className={hasUsdcExchangeAllowance ? 'text-green-600' : 'text-amber-600'}>
            USDC → Exchange {hasUsdcExchangeAllowance ? '已授权' : '待授权'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {hasCtfExchangeAllowance ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
          <span className={hasCtfExchangeAllowance ? 'text-green-600' : 'text-amber-600'}>
            CTF → Exchange {hasCtfExchangeAllowance ? '已授权' : '待授权'}
          </span>
        </div>
      </div>

      {/* 授权按钮 */}
      {needsApproval && (
        <Button size="sm" onClick={handleApprove} disabled={approving} className="w-full">
          {approving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              授权中...
            </>
          ) : (
            '执行授权'
          )}
        </Button>
      )}

      {/* 刷新按钮 */}
      <Button
        size="sm"
        variant="ghost"
        onClick={checkStatus}
        disabled={checking}
        className="w-full text-xs"
      >
        {checking ? '检查中...' : '刷新状态'}
      </Button>
    </div>
  );
}
