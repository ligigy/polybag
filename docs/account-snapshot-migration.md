# 账户 Snapshot 客户端化迁移

## 变更说明

已将账户快照功能从服务端 API 路由迁移到纯客户端执行。

### 移除的文件

- ❌ `/src/app/api/account/snapshot/route.ts` - 服务端 API 路由

### 新增的文件

- ✅ `/src/services/polymarket/account-client.ts` - 客户端账户服务

### 修改的文件

- ✅ `/src/app/components/AccountAllowanceBlock.tsx` - 直接调用客户端服务

## 新的架构

### 之前（服务端）

```
AccountAllowanceBlock
  → fetch('/api/account/snapshot')
    → AccountService.getSnapshot()
      → ClobClient (服务端)
```

### 现在（客户端）

```
AccountAllowanceBlock
  → getAccountSnapshot(signer, creds)
    → ClobClient (浏览器端，使用前端钱包)
```

## 优势

1. **减少网络请求**：无需经过服务端中转
2. **更快响应**：直接调用 CLOB API
3. **简化架构**：移除不必要的 API 路由层
4. **安全性**：凭证和签名操作都在客户端进行
5. **降低服务器负载**：不占用服务端资源

## 使用示例

```typescript
import { getAccountSnapshot } from '@/services/polymarket/account-client';
import { getStoredApiKey } from '@/lib/storage/apiKeyStore';
import { ensureTypedDataCompatibility } from '@/lib/wallet/signTypedData';
import { BrowserProvider } from 'ethers';

// 获取前端钱包 signer
const provider = new BrowserProvider(window.ethereum);
const signerV6 = await provider.getSigner();
const signer = ensureTypedDataCompatibility(signerV6);

// 获取存储的 API 凭证
const creds = getStoredApiKey();

// 转换格式
const apiCredentials = {
  apiKey: creds.key,
  secret: creds.secret,
  passphrase: creds.passphrase,
};

// 获取账户快照
const snapshot = await getAccountSnapshot(
  signer,
  apiCredentials,
  'https://clob.polymarket.com',
  137
);

console.log('USDC Balance:', snapshot.balance.usdc);
console.log('Allowance:', snapshot.balance.allowance);
```

## API 参考

### `getAccountSnapshot`

获取账户快照（USDC 余额和授权）

**参数：**

- `signer: any` - 前端钱包 signer
- `creds: ApiCredentials` - API 凭证 `{ apiKey, secret, passphrase }`
- `apiUrl?: string` - CLOB API URL（默认：`https://clob.polymarket.com`）
- `chainId?: number` - 链 ID（默认：`137`）

**返回：**

```typescript
{
  balance: {
    usdc: number;
    allowance: number;
  }
  lastUpdated: number;
}
```

### `getTokenBalance`

获取特定 token 的余额和授权

**参数：**

- `signer: any` - 前端钱包 signer
- `creds: ApiCredentials` - API 凭证
- `tokenId: string` - Token ID
- `apiUrl?: string` - CLOB API URL
- `chainId?: number` - 链 ID

**返回：**

```typescript
{
  balance: number;
  allowance: number;
}
```

## 类型定义

```typescript
export interface AccountSnapshot {
  balance: {
    usdc: number;
    allowance: number;
  };
  lastUpdated: number;
}

export interface ApiCredentials {
  apiKey: string;
  secret: string;
  passphrase: string;
}
```

## 注意事项

1. **钱包连接**：确保用户已连接浏览器钱包（MetaMask 等）
2. **API 凭证**：确保已通过 ApiKeyManager 设置 API Key
3. **错误处理**：需要处理钱包未连接、凭证缺失等错误情况
4. **类型转换**：注意 `ApiKeyCreds.key` → `ApiCredentials.apiKey` 的映射
