// 客户端账户服务 - 直接在浏览器中执行，无需通过 API 路由
import { ClobClient, AssetType } from '@polymarket/clob-client';
import { Contract } from 'ethers';
import type { ApiCredentials } from './clob-adapter';

export interface AccountSnapshot {
  balance: {
    usdc: number;
    allowance: number;
  };
  lastUpdated: number;
}

export interface ProxyWalletBalance {
  walletBalance: number; // 钱包中的 USDC（未 deposit）
  proxyBalance: number; // Proxy 钱包中的 USDC（已 deposit）
  totalBalance: number; // 总计
}

// USDC 合约地址（Polygon Mainnet）
const USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const USDC_ABI = ['function balanceOf(address owner) view returns (uint256)'];

/**
 * 在客户端直接获取账户快照
 * @param signer - 前端钱包 signer
 * @param creds - API 凭证
 * @param apiUrl - CLOB API URL
 * @param chainId - 链 ID
 */
export async function getAccountSnapshot(
  signer: any,
  creds: ApiCredentials,
  apiUrl: string = 'https://clob.polymarket.com',
  chainId: number = 137
): Promise<AccountSnapshot> {
  const client = new ClobClient(apiUrl, chainId, signer, {
    key: creds.apiKey,
    secret: creds.secret,
    passphrase: creds.passphrase,
  });

  // 获取 USDC 余额和授权
  const collateral = await client.getBalanceAllowance({
    asset_type: AssetType.COLLATERAL,
  });

  console.log('collateral raw response:', collateral);

  // USDC 使用 6 位小数，需要除以 1000000
  const balance = Number(collateral?.balance || 0) / 1_000_000;

  // 实际 API 返回的是 allowances（复数），但 TypeScript 类型定义是 allowance
  // 使用类型断言来访问实际的 allowances 对象
  const response = collateral as any;
  const allowances = response?.allowances || {};

  // Exchange 合约地址（Polygon Mainnet）
  const exchangeAddress = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';
  const exchangeAllowance = allowances[exchangeAddress] || '0';
  const allowance = Number(exchangeAllowance) / 1_000_000;

  console.log('Parsed balance:', balance, 'USDC');
  console.log('Exchange allowance:', allowance, 'USDC');

  return {
    balance: {
      usdc: balance,
      allowance: allowance,
    },
    lastUpdated: Date.now(),
  };
}

/**
 * 获取特定 token 的余额和授权
 */
export async function getTokenBalance(
  signer: any,
  creds: ApiCredentials,
  tokenId: string,
  apiUrl: string = 'https://clob.polymarket.com',
  chainId: number = 137
): Promise<{ balance: number; allowance: number }> {
  const client = new ClobClient(apiUrl, chainId, signer, {
    key: creds.apiKey,
    secret: creds.secret,
    passphrase: creds.passphrase,
  });

  const tokenInfo = await client.getBalanceAllowance({
    asset_type: AssetType.CONDITIONAL,
    token_id: tokenId,
  });

  return {
    balance: Number(tokenInfo?.balance || 0),
    allowance: Number(tokenInfo?.allowance || 0),
  };
}

/**
 * 获取 Polymarket Proxy 钱包中已 deposit 的 USDC 余额
 * @param signer - 前端钱包 signer
 * @param proxyAddress - Polymarket Proxy 钱包地址
 */
export async function getProxyWalletBalance(
  signer: any,
  proxyAddress: string
): Promise<ProxyWalletBalance> {
  // 获取用户钱包地址
  const walletAddress = await signer.getAddress();

  // 创建 USDC 合约实例
  const usdcContract = new Contract(USDC_ADDRESS, USDC_ABI, signer);

  // 并行查询两个地址的余额
  const [walletBalanceRaw, proxyBalanceRaw] = await Promise.all([
    usdcContract.balanceOf(walletAddress),
    usdcContract.balanceOf(proxyAddress),
  ]);

  // USDC 使用 6 位小数
  const walletBalance = Number(walletBalanceRaw) / 1_000_000;
  const proxyBalance = Number(proxyBalanceRaw) / 1_000_000;

  console.log('Wallet address:', walletAddress);
  console.log('Wallet USDC balance:', walletBalance);
  console.log('Proxy address:', proxyAddress);
  console.log('Proxy USDC balance (deposited):', proxyBalance);

  return {
    walletBalance,
    proxyBalance,
    totalBalance: walletBalance + proxyBalance,
  };
}
