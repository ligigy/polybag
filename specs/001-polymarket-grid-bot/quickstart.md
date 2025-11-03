# Quickstart: Polymarket 网格交易平台

## Prerequisites
- Node.js 18+、pnpm/npm
- 钱包/私钥（仅实盘需要）；Polygon RPC 端点（可选自定义）

## Install & Run UI
```bash
pnpm install
pnpm dev
```

## Run Worker (draft)
初期以 Node 进程运行策略 Worker（后续提供 CLI）：
```bash
# 示例：以 PAPER 模式运行某市场单向网格（伪命令，后续补齐）
node src/worker/run-grid.js \
  --market <MARKET_ID> --side YES \
  --min 0.30 --max 0.70 --step 0.02 \
  --size 100 --budget 1000 \
  --mode PAPER
```

## Configuration
- 安装 SDK：
```bash
pnpm add @polymarket/clob-client ethers
# 前端钱包（推荐）
pnpm add wagmi viem @tanstack/react-query
# 多钱包 UI（二选一）
pnpm add @rainbow-me/rainbowkit @walletconnect/modal
# 或者使用 web3modal（替代方案）
# pnpm add @web3modal/wagmi @web3modal/react

# UI 组件库（shadcn/ui）
# 初始化（只需一次）：
npx shadcn@latest init -d -y
# 按需添加组件（示例）
npx shadcn@latest add button input select card table dialog toast badge tabs switch skeleton alert separator
```

- 默认端点（来自 polymarket-docs/endpoints.md）：
  - REST `{clob-endpoint}`：`https://clob.polymarket.com`
  - WebSocket `{wss-channel}`：`wss://ws-subscriptions-clob.polymarket.com/ws`
  - Data-API：`https://data-api.polymarket.com/`
  - RTDS：`wss://ws-live-data.polymarket.com`

- 环境变量（可选覆盖）：
  - `CLOB_API_URL`：覆盖 REST 端点（默认 `https://clob.polymarket.com`）
  - `WS_URL`：覆盖 WS 端点（默认 `wss://ws-subscriptions-clob.polymarket.com/ws`）
  - `CLOB_API_KEY`：访问密钥（如需）
  - `CLOB_SECRET`：访问密钥 secret
  - `CLOB_PASS_PHRASE`：访问密钥 passphrase
  - `POLYGON_RPC_URL`：Polygon RPC
  - `WALLET_PRIVATE_KEY`：交易私钥（实盘）
  - `DATA_DIR`：状态持久化目录（默认 `./data/state`）
  - `CHAIN_ID`：链 ID（Mainnet 137 / Amoy 80002）
  - `NEXT_PUBLIC_WALLETCONNECT_ID`：WalletConnect Project ID（RainbowKit 必填）
  - `NEXT_PUBLIC_POLYGON_RPC_URL`：前端用 Polygon RPC（RainbowKit/viem）
  - `NEXT_PUBLIC_POLYGON_AMOY_RPC_URL`：前端用 Polygon Amoy RPC（测试）

## 前端钱包最小集成示意（Wagmi + RainbowKit）
```ts
// app/providers.tsx
"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { polygon, polygonAmoy } from "viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";

const config = getDefaultConfig({
  appName: "Poly Grid Bot",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID!,
  chains: [polygon, polygonAmoy],
  transports: {
    [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL),
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL),
  },
});
const qc = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={qc}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```
```tsx
// app/layout.tsx 里包裹 <Providers>
```
```tsx
// app/components/WalletConnectButton.tsx
"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
export default function WalletConnectButton(){ return <ConnectButton /> }
```

## 使用 shadcn/ui 的建议
- 将表单与按钮替换为 `@/app/components/ui` 下的组件（如 Button/Input/Select/Card/Table/Dialog/Toast）。
- 封装通用的 `Form` 与 `Dialog` 以统一验证与模态交互。
- 配置 Tailwind 暗色模式与主题变量，满足交易面板的对比度需求。
- 前端页面：提供参数表单与状态面板（后续迭代）

## Safety Notes
- 在 PAPER/回测模式完成参数验证前，不要在主网实盘运行。
- 设置合理的资金上限、亏损阈值与止损；启用冷却与告警。

## Allowance 预检（实盘必需）
- 为 USDC 设置对 CTF 与 Exchange 的 allowance；为 CTF 设置 `setApprovalForAll(exchange, true)`。
- 可参考 `clob-client-main/examples/approveAllowances.ts` 的链上交互脚本；或在 UI 中提供“一键检测与引导”。

## WebSocket 与市场监听
- 服务器侧使用 `WS_URL/ws/market` 订阅 `assets_ids`（tokenIDs）与 `markets`（condition_id），并设置 `initial_dump: true`；汇总后通过 SSE 推送给前端。
- 用户私有流（`/ws/user`）需携带 `auth{ apiKey, secret, passphrase }`，用于订单/成交推送。
