// Polymarket 授权管理服务
// 处理 USDC 和 Conditional Tokens 的授权检查和设置

export interface AllowanceStatus {
  hasUsdcAllowance: boolean;
  hasTokenAllowance: boolean;
  usdcBalance: string;
  tokenBalance: string;
  needsApproval: boolean;
}

export interface ApprovalResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * 检查用户的余额和授权状态
 */
export async function checkAllowanceStatus(
  client: any,
  tokenID: string,
  requiredAmount: number
): Promise<AllowanceStatus> {
  try {
    const { AssetType } = await import('@polymarket/clob-client');

    // 检查 USDC 余额和授权
    const collateralInfo = await client.getBalanceAllowance({
      asset_type: AssetType.COLLATERAL,
    });

    // 检查对应 token 的余额和授权
    const tokenInfo = await client.getBalanceAllowance({
      asset_type: AssetType.CONDITIONAL,
      token_id: tokenID,
    });

    // 将字符串转换为数字进行比较
    const usdcAllowance = parseFloat(collateralInfo.allowance || '0');
    const tokenAllowance = parseFloat(tokenInfo.allowance || '0');

    // 检查是否有足够的授权（授权应该远大于所需金额）
    const hasUsdcAllowance = usdcAllowance > requiredAmount * 100; // 授权应该足够大
    const hasTokenAllowance = tokenAllowance > requiredAmount * 100;

    return {
      hasUsdcAllowance,
      hasTokenAllowance,
      usdcBalance: collateralInfo.balance,
      tokenBalance: tokenInfo.balance,
      needsApproval: !hasUsdcAllowance || !hasTokenAllowance,
    };
  } catch (error) {
    console.error('检查授权状态失败:', error);
    throw error;
  }
}

/**
 * 设置授权（USDC 和 Conditional Tokens）
 */
export async function approveAllowances(client: any): Promise<ApprovalResult> {
  try {
    // 设置所有必要的授权
    const result = await client.setAllowance();

    return {
      success: true,
      txHash: result?.hash || result?.transactionHash,
    };
  } catch (error: any) {
    console.error('授权失败:', error);
    return {
      success: false,
      error: error?.message || '授权失败',
    };
  }
}

/**
 * 格式化余额显示
 */
export function formatBalance(balance: string): string {
  const num = parseFloat(balance || '0');
  if (num === 0) return '0';
  if (num < 0.01) return '<0.01';
  return num.toFixed(2);
}
