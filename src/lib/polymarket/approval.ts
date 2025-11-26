/**
 * Polymarket 授权相关工具函数
 */

import { ClobClient, AssetType } from '@polymarket/clob-client';

/**
 * 获取 Exchange 合约地址
 */
export function getExchangeAddress(chain: number): string {
  return chain === 137
    ? '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E' // Polygon Mainnet
    : '0xdFE02Eb6733538f8Ea35D585af8DE5958AD99E40'; // Polygon Amoy
}

/**
 * 获取 USDC 合约地址
 */
export function getUSDCAddress(chain: number): string {
  return chain === 137
    ? '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' // Polygon Mainnet
    : '0x9c4e1703476e875070ee25b56a58b008cfb8fa78'; // Polygon Amoy
}

/**
 * 获取 CTF 合约地址
 */
export function getCTFAddress(chain: number): string {
  return chain === 137
    ? '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045' // Polygon Mainnet
    : '0x69308FB512518e39F9b16112fA8d994F4e2Bf8bB'; // Polygon Amoy
}

/**
 * 余额和授权信息
 */
export interface BalanceAllowanceInfo {
  balance: number; // USDC 余额（已转换为实际金额）
  allowance: number; // 授权额度（已转换为实际金额）
  rawBalance: string; // 原始余额
  rawAllowance: string; // 原始授权额度
}

/**
 * 检查余额和授权状态
 */
export async function checkBalanceAllowance(
  client: ClobClient,
  chain: number
): Promise<BalanceAllowanceInfo> {
  const balanceAllowance = await client.getBalanceAllowance({
    asset_type: AssetType.COLLATERAL,
  });

  const exchangeAddress = getExchangeAddress(chain);

  // USDC 使用 6 位小数
  const balance = Number(balanceAllowance?.balance || 0) / 1e6;

  // 从 allowances 对象中获取对应 Exchange 地址的授权额度
  const allowancesData = (balanceAllowance as any)?.allowances || {};
  const rawAllowance = allowancesData[exchangeAddress] || '0';
  const allowance = Number(rawAllowance) / 1e6;

  return {
    balance,
    allowance,
    rawBalance: balanceAllowance?.balance || '0',
    rawAllowance,
  };
}

/**
 * 检查是否有足够的余额和授权额度
 */
export function validateBalanceAllowance(
  info: BalanceAllowanceInfo,
  requiredAmount: number
): { valid: boolean; error?: string } {
  if (info.balance < requiredAmount) {
    return {
      valid: false,
      error: `USDC 余额不足：需要 ${requiredAmount}，当前 ${info.balance.toFixed(2)}`,
    };
  }

  if (info.allowance < requiredAmount) {
    return {
      valid: false,
      error: `USDC 授权额度不足：需要 ${requiredAmount}，当前 ${info.allowance.toFixed(2)}。请进行授权。`,
    };
  }

  return { valid: true };
}

/**
 * 判断是否为最大授权额度（接近 MaxUint256）
 */
export function isMaxAllowance(allowance: number): boolean {
  return allowance > 1e60;
}

/**
 * 格式化显示授权额度
 */
export function formatAllowance(allowance: number): string {
  return isMaxAllowance(allowance) ? '无限制' : allowance.toFixed(2);
}

/**
 * 执行链上授权（直接调用 USDC 合约）
 */
export async function approveUSDC(
  signer: any,
  chain: number,
  onProgress?: (message: string) => void
): Promise<{ success: boolean; error?: string; txHash?: string }> {
  try {
    const { constants, Contract } = await import('ethers');

    const exchangeAddress = getExchangeAddress(chain);
    const usdcAddress = getUSDCAddress(chain);

    onProgress?.('正在设置授权，请在钱包中确认交易...');

    // USDC ABI - 只需要 approve 方法
    const usdcAbi = [
      'function approve(address spender, uint256 amount) public returns (bool)',
      'function allowance(address owner, address spender) public view returns (uint256)',
    ];

    // 创建 USDC 合约实例
    const usdcContract = new Contract(usdcAddress, usdcAbi, signer);

    // 授权最大额度给 Exchange 合约
    const tx = await usdcContract.approve(exchangeAddress, constants.MaxUint256);

    onProgress?.(`交易已提交，哈希: ${tx.hash}，等待确认...`);
    console.log('📝 授权交易已提交:', tx.hash);

    // 等待交易确认
    const receipt = await tx.wait();

    console.log('✅ 授权交易已确认:', receipt);
    onProgress?.('链上授权成功！');

    return { success: true, txHash: tx.hash };
  } catch (error: any) {
    console.error('授权失败:', error);
    const errorMsg = error?.message || '未知错误';
    return { success: false, error: errorMsg };
  }
}

/**
 * 通知 Polymarket 服务器更新授权状态
 */
export async function notifyPolymarketAllowanceUpdate(
  client: ClobClient,
  onProgress?: (message: string) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    onProgress?.('正在通知 Polymarket 服务器...');

    // 调用 updateBalanceAllowance 通知服务器
    await client.updateBalanceAllowance({
      asset_type: AssetType.COLLATERAL,
    });

    console.log('✅ 已通知 Polymarket 服务器');
    onProgress?.('授权完成！');

    return { success: true };
  } catch (error: any) {
    console.warn('⚠️ 通知服务器失败，但链上授权已成功:', error);
    const errorMsg = error?.message || '未知错误';
    return { success: false, error: errorMsg };
  }
}
