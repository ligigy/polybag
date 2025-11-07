# Polymarket CLOB Adapter 使用指南

## 重构说明

已重构 `ClobClientAdapter` 以支持纯前端钱包签名模式：

### 变更

- ✅ 移除 `privateKey` 和 `rpcUrl` 配置
- ✅ 移除内部缓存的 `rwClient`
- ✅ 所有写操作方法都需要传入 `signer` 和 `creds`
- ✅ 使用前端钱包进行签名，而非服务端私钥

### 初始化

```typescript
import { PolymarketClobAdapter } from '@/services/polymarket/clob-adapter';

const adapter = new PolymarketClobAdapter();
await adapter.init({
  apiUrl: 'https://clob.polymarket.com',
  chainId: 137, // Polygon Mainnet
});
```

### 使用示例

#### 读取操作（无需签名）

```typescript
// 获取市场列表
const markets = await adapter.listMarkets();

// 获取订单簿
const orderbook = await adapter.getOrderBook(tokenID);
```

#### 写入操作（需要签名和凭证）

```typescript
import { BrowserProvider } from 'ethers';
import { ensureTypedDataCompatibility } from '@/lib/wallet/signTypedData';

// 1. 获取前端钱包 signer
const provider = new BrowserProvider(window.ethereum);
const signerV6 = await provider.getSigner();
const signer = ensureTypedDataCompatibility(signerV6);

// 2. 准备 API 凭证
const creds = {
  apiKey: 'your-api-key',
  secret: 'your-secret',
  passphrase: 'your-passphrase',
};

// 3. 创建订单
const order = await adapter.createOrder(
  {
    tokenID: '123...',
    price: 0.5,
    size: 10,
    side: 'BUY',
    orderType: 'GTC',
  },
  signer,
  creds
);

// 4. 提交订单
const result = await adapter.postOrder(order, 'GTC', signer, creds);

// 5. 查询余额
const balance = await adapter.getBalance(signer, creds);

// 6. 取消订单
await adapter.cancelOrder(orderId, signer, creds);

// 7. 取消所有订单
await adapter.cancelAll(signer, creds);
```

### API 接口变更

所有需要认证的方法现在都需要额外的参数：

```typescript
// 旧接口
async createOrder(req: PlaceOrderRequest): Promise<any>

// 新接口
async createOrder(
  req: PlaceOrderRequest,
  signer: any,
  creds: ApiCredentials
): Promise<any>
```

受影响的方法：

- `createOrder(req, signer, creds)`
- `postOrder(order, orderType, signer, creds)`
- `postOrders(args, signer, creds)`
- `cancelOrder(orderId, signer, creds)`
- `cancelAll(signer, creds)`
- `getOpenOrders(filter, signer, creds)`
- `getTrades(filter, firstPageOnly, signer, creds)`
- `getPricesHistory(filter, signer, creds)`
- `getBalance(signer, creds)`

### 类型定义

```typescript
export type ApiCredentials = {
  apiKey: string;
  secret: string;
  passphrase: string;
};

export type AdapterInitConfig = {
  apiUrl?: string;
  wsUrl?: string;
  chainId?: number;
};
```

### 优势

1. **安全性提升**：私钥永远不离开用户浏览器
2. **灵活性**：支持任意钱包（MetaMask、WalletConnect 等）
3. **无服务端依赖**：完全前端化
4. **多账户支持**：可以轻松切换不同的 signer 和凭证

### 注意事项

- 每次操作都需要提供 `signer` 和 `creds`，不再缓存
- `signer` 必须是兼容的 ethers v6 Signer 对象
- API 凭证应该通过安全的方式获取和存储（如派生 API Key）
