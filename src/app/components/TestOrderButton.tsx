'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { getStoredApiKey } from '@/lib/storage/apiKeyStore';
import { Outcome } from '@/services/polymarket/types';
import ApprovalStatus from './ApprovalStatus';
import { checkBalanceAllowance, validateBalanceAllowance } from '@/lib/polymarket/approval';

type OrderBookLevel = { price: number; size: number; count?: number };
type OrderBookData = {
  marketId: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  ts: number;
  mid?: number;
  spread?: number;
} | null;

export default function TestOrderButton({
  tokenID,
  side,
  orderbook,
}: {
  tokenID: string;
  side: Outcome;
  orderbook: OrderBookData;
}) {
  const { notify } = useToast();
  const [busy, setBusy] = React.useState(false);
  const [amount, setAmount] = React.useState(5); // USDC amount for market order
  const [showApproval, setShowApproval] = React.useState(false);

  // EOA 模式下通过 API 检查，不需要本地授权状态
  const canPlaceOrder = true; // 简化逻辑，在下单时实时检查

  async function placeTestOrder() {
    setBusy(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_CLOB_API_URL || 'https://clob.polymarket.com';
      const chain = Number(process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || 137);
      const { ClobClient, OrderType, Side } = await import('@polymarket/clob-client');
      const { providers } = await import('ethers');

      const eth: any = (window as any).ethereum;
      if (!eth) throw new Error('未检测到浏览器钱包');

      // 连接浏览器钱包
      await eth.request({ method: 'eth_requestAccounts' });
      const provider = new providers.Web3Provider(eth);
      const signer = provider.getSigner();
      const eoa = await signer.getAddress();

      console.log('💼 EOA 地址:', eoa);

      const temp = new ClobClient(apiUrl, chain, signer);

      // 会话内派生 API Key（L2 creds），不写入 localStorage
      const creds = await temp.createOrDeriveApiKey();
      // ✅ 关键：不传 funder、不传 signatureType，让 ClobClient 自动处理
      const client = new ClobClient(apiUrl, chain, signer, creds);

      // // 检查或创建 API Key（这会触发必要的钱包签名）
      // const creds = getStoredApiKey();
      // if (!creds) {
      //   notify('正在派生 API Key，请在钱包中签名...');
      //   await client.createOrDeriveApiKey();
      //   notify('API Key 派生成功！');
      // }

      console.log('💼 客户端配置:', {
        apiUrl,
        chain,
        eoa,
        mode: 'EOA (Browser Wallet)',
      });

      // 再次检查授权状态
      let canTrade = false;
      try {
        const info = await checkBalanceAllowance(client, chain);

        console.log('🔐 余额&授权状态:', info);
        console.log('💰 余额:', info.balance, 'USDC');
        console.log('🔓 授权额度:', info.allowance, 'USDC');

        const validation = validateBalanceAllowance(info, amount);

        if (!validation.valid) {
          notify(validation.error!);
          if (validation.error?.includes('授权额度不足')) {
            setShowApproval(true);
          }
          return;
        }

        canTrade = true;
        console.log('✅ 余额和授权检查通过');
      } catch (err) {
        console.error('❌ 检查余额授权失败:', err);
        notify('检查余额授权失败，请重试');
        return;
      }

      if (!canTrade) {
        return;
      }

      // 获取当前订单薄的买一/卖一作为测试价格
      let price = 0.5; // fallback 测试价格

      if (orderbook) {
        const bestBid = orderbook.bids?.[0]?.price;
        const bestAsk = orderbook.asks?.[0]?.price;
        console.log('📊 使用已订阅的 Orderbook 数据');
        console.log('📊 bestBid:', bestBid, 'bestAsk:', bestAsk);

        if (side === 'YES' || side === 'NO') {
          // 买入 YES 或 NO -> 以卖一（best ask）下单
          if (typeof bestAsk === 'number' && !Number.isNaN(bestAsk)) {
            price = bestAsk;
            console.log('✅ 使用 bestAsk 作为价格:', price);
          }
        }
      } else {
        console.warn('⚠️ Orderbook 数据未就绪，使用 fallback price');
      }

      console.log('🎯 下单参数 =>', { tokenID, price, side, amount });

      // ✅ 使用 createAndPostOrder，传入正确的参数
      const resp = await client.createAndPostOrder(
        {
          tokenID,
          price,
          side: Side.BUY, // 买入 YES 或 NO 都用 BUY
          size: amount,
        },
        {
          tickSize: '0.01', // 默认 tickSize，可能需要根据市场调整
          negRisk: false, // 默认为 false，可能需要根据市场调整
        },
        OrderType.GTC // Good Till Cancel
      );

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

      {/* 授权面板 */}
      {showApproval && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">授权状态</h3>
          <ApprovalStatus />
        </div>
      )}
    </div>
  );
}
