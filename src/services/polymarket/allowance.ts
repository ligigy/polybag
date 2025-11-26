// Polymarket 授权管理服务
// 处理 USDC 和 Conditional Tokens 的授权检查和设置
import { Contract, constants } from 'ethers';

const { MaxUint256 } = constants;

export interface AllowanceStatus {
  hasUsdcCtfAllowance: boolean;
  hasUsdcExchangeAllowance: boolean;
  hasCtfExchangeAllowance: boolean;
  usdcBalance: string;
  needsApproval: boolean;
}

export interface ApprovalResult {
  success: boolean;
  txHashes?: string[];
  error?: string;
}

// 合约配置（Polygon Mainnet）
const CONTRACTS = {
  137: {
    // Polygon Mainnet
    usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    ctf: '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045',
    exchange: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E',
  },
  80002: {
    // Amoy Testnet
    usdc: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97',
    ctf: '0x69308FB512518e39F9b16112fA8d994F4e2Bf8bB',
    exchange: '0xdFE02Eb6733538f8Ea35D585af8DE5958AD99E40',
  },
};

// USDC ABI (只需要这几个方法)
const USDC_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

// CTF ABI (只需要这几个方法)
const CTF_ABI = [
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function setApprovalForAll(address operator, bool approved)',
];

/**
 * 检查用户的授权状态
 */
export async function checkAllowanceStatus(
  signer: any,
  chainId: number = 137
): Promise<AllowanceStatus> {
  try {
    const config = CONTRACTS[chainId as keyof typeof CONTRACTS];
    if (!config) {
      throw new Error(`Unsupported chainId: ${chainId}`);
    }

    const address = await signer.getAddress();

    // 创建合约实例
    const usdcContract = new Contract(config.usdc, USDC_ABI, signer);
    const ctfContract = new Contract(config.ctf, CTF_ABI, signer);

    // 并行检查所有授权状态
    const [usdcBalance, usdcCtfAllowance, usdcExchangeAllowance, ctfExchangeApproved] =
      await Promise.all([
        usdcContract.balanceOf(address),
        usdcContract.allowance(address, config.ctf),
        usdcContract.allowance(address, config.exchange),
        ctfContract.isApprovedForAll(address, config.exchange),
      ]);

    // 检查授权是否足够（大于0即认为已授权）
    const hasUsdcCtfAllowance = usdcCtfAllowance > BigInt(0);
    const hasUsdcExchangeAllowance = usdcExchangeAllowance > BigInt(0);
    const hasCtfExchangeAllowance = ctfExchangeApproved;

    return {
      hasUsdcCtfAllowance,
      hasUsdcExchangeAllowance,
      hasCtfExchangeAllowance,
      usdcBalance: usdcBalance.toString(),
      needsApproval: !hasUsdcCtfAllowance || !hasUsdcExchangeAllowance || !hasCtfExchangeAllowance,
    };
  } catch (error) {
    console.error('检查授权状态失败:', error);
    throw error;
  }
}

/**
 * 设置所有必要的授权
 */
export async function approveAllowances(
  signer: any,
  chainId: number = 137
): Promise<ApprovalResult> {
  const txHashes: string[] = [];

  try {
    const config = CONTRACTS[chainId as keyof typeof CONTRACTS];
    if (!config) {
      throw new Error(`Unsupported chainId: ${chainId}`);
    }

    const address = await signer.getAddress();

    // 创建合约实例
    const usdcContract = new Contract(config.usdc, USDC_ABI, signer);
    const ctfContract = new Contract(config.ctf, CTF_ABI, signer);

    // 检查当前授权状态
    const [usdcCtfAllowance, usdcExchangeAllowance, ctfExchangeApproved] = await Promise.all([
      usdcContract.allowance(address, config.ctf),
      usdcContract.allowance(address, config.exchange),
      ctfContract.isApprovedForAll(address, config.exchange),
    ]);

    // 1. 授权 USDC 给 CTF 合约
    if (usdcCtfAllowance === BigInt(0)) {
      console.log('授权 USDC → CTF...');
      const tx1 = await usdcContract.approve(config.ctf, MaxUint256);
      await tx1.wait();
      txHashes.push(tx1.hash);
      console.log(`✓ USDC → CTF 授权成功: ${tx1.hash}`);
    }

    // 2. 授权 USDC 给 Exchange 合约
    if (usdcExchangeAllowance === BigInt(0)) {
      console.log('授权 USDC → Exchange...');
      const tx2 = await usdcContract.approve(config.exchange, MaxUint256);
      await tx2.wait();
      txHashes.push(tx2.hash);
      console.log(`✓ USDC → Exchange 授权成功: ${tx2.hash}`);
    }

    // 3. 授权 CTF 给 Exchange 合约
    if (!ctfExchangeApproved) {
      console.log('授权 CTF → Exchange...');
      const tx3 = await ctfContract.setApprovalForAll(config.exchange, true);
      await tx3.wait();
      txHashes.push(tx3.hash);
      console.log(`✓ CTF → Exchange 授权成功: ${tx3.hash}`);
    }

    if (txHashes.length === 0) {
      console.log('所有授权已完成，无需重复授权');
    }

    return {
      success: true,
      txHashes,
    };
  } catch (error: any) {
    console.error('授权失败:', error);
    return {
      success: false,
      txHashes,
      error: error?.message || '授权失败',
    };
  }
}

/**
 * 格式化余额显示
 */
export function formatBalance(balance: string): string {
  try {
    // USDC 有 6 位小数
    const num = Number(balance) / 1e6;
    if (num === 0) return '0';
    if (num < 0.01) return '<0.01';
    return num.toFixed(2);
  } catch {
    return '0';
  }
}
