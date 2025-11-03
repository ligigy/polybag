# Polymarket 自动化网格交易平台

![Status](https://img.shields.io/badge/status-development-yellow)
![Phase](https://img.shields.io/badge/phase-P1%20MVP-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

自动化网格交易系统，在 Polymarket 上运行，支持可配置的网格策略、实时风控与回测功能。

## 🚀 快速开始

### 前置条件

- Node.js 18+
- pnpm 8+（或 npm/yarn）
- MetaMask 或其他以太坊钱包
- Polygon Amoy 测试网 USDC（用于测试）

### 本地开发

#### 1. 克隆与安装

```bash
git clone <repo-url>
cd polybag
pnpm install
```

#### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local` 并设置：

```env
NEXT_PUBLIC_CHAIN_ID=80002  # Amoy 测试网
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_id_here
NEXT_PUBLIC_CLOB_API_URL=https://clob.polymarket.com
NEXT_PUBLIC_WS_URL=wss://ws-subscriptions-clob.polymarket.com
```

#### 3. 启动开发服务器

```bash
pnpm dev
```

打开 [http://localhost:3000/grid](http://localhost:3000/grid)

#### 4. 钱包连接

1. 安装 MetaMask 浏览器扩展
2. 切换到 Polygon Amoy 测试网
3. 获取测试 USDC：[Amoy Faucet](https://faucet.circle.com/)
4. 在页面上点击"连接钱包"

### 演示路径（Grid E2E）

1. 打开 [http://localhost:3000/grid](http://localhost:3000/grid)
2. 在“事件查询”中输入 Polymarket 事件 slug（例如 `will-trump-win-2024`），点击“查询”
3. 在市场列表中选择 YES/NO 方向，确认订单簿实时数据正常刷新
4. 调整网格配置区间、步长、预算等参数，查看实时计算的层数与预算占比
5. 点击“保存配置”后，使用“启动策略”触发 worker，`策略状态` 卡片会显示心跳与计划
6. 测试下单按钮可使用当前 tokenID 向 CLOB 发送测试市价单（需持有 API Key）

## 📁 项目结构

```
polybag/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── grid/                 # 网格交易主页面
│   │   ├── api/                  # App Routes (API endpoints)
│   │   └── components/           # React 组件
│   ├── lib/                      # 工具库
│   │   ├── grid/                 # 网格引擎
│   │   ├── persistence/          # 状态持久化
│   │   └── utils/                # 公共工具
│   ├── services/                 # 服务层
│   │   └── polymarket/           # Polymarket 市场适配
│   └── worker/                   # 策略执行器
├── tests/                        # 测试
├── specs/                        # 规范文档
└── README.md
```

## 🛠️ 开发

### 运行开发服务器

```bash
pnpm dev
```

### 运行测试

```bash
pnpm test
```

### 代码质量

```bash
pnpm lint
pnpm format
```

## 📚 文档

- [功能规范](./specs/001-polymarket-grid-bot/spec.md)
- [实现计划](./specs/001-polymarket-grid-bot/plan.md)
- [任务清单](./specs/001-polymarket-grid-bot/tasks.md)
