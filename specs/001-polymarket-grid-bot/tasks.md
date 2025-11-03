# Tasks: Polymarket 自动化网格交易平台# Tasks: Polymarket 自动化网格交易平台

**Feature Branch**: `001-polymarket-grid-bot` > 依据 spec.md 与 plan.md 拆解的可执行任务清单。任务按阶段划分，默认优先完成 P1（网格引擎 + CLOB 适配 + 前端监听/配置）。

**Status**: Ready for implementation

**Base**: spec.md (User Stories P1/P2/P3) + plan.md (Tech Stack & Architecture)## Phase 0 — Research（接口与安全）

- [ ] 梳理 CLOB SDK 能力矩阵：下单/撤单/批量、GTD 过期规则（≥now+10s）、市价单 FOK/FAK、开单限额/速率限制。

> 基于 spec.md 的 3 个用户故事（US1/US2/US3）与 plan.md 的实现计划，拆解为可执行任务清单。- [ ] 确认签名路径：EOA 与（可选）Proxy/Gnosis；前端 EIP‑712 是否由 SDK 生成 payload（或后端生成、前端签名）。

> 任务按阶段（Phase）组织，每个阶段内按用户故事（US1/US2/US3）优先级排列。- [ ] 明确 WS 订阅：`/ws/market` 与 `/ws/user` 的消息结构、initial_dump、心跳 PING、断线重连策略与速率限制。

> P1 建议 MVP 范围：Phase 1 + Phase 2 + Phase 3（US1）；Phase 4（US2）与 Phase 5（US3）推迟到后续迭代。- [ ] 账户权限与授权：USDC→CTF/Exchange allowance，CTF `setApprovalForAll(exchange,true)`；形成检查清单。

- [ ] 环境变量与密钥清单：`CLOB_API_URL/WS_URL/CLOB_API_KEY/CLOB_SECRET/CLOB_PASS_PHRASE/CHAIN_ID` 等；前端 `NEXT_PUBLIC_*`。

---- [ ] 数据模型校验：对齐 `tokenID/conditionId/OrderType` 与 SDK；更新 data-model.md 差异清单（若有）。

## User Stories Summary & Dependencies## Phase 1 — Design（契约与结构）

- [ ] 定义 `services/polymarket/clob-adapter.ts` 接口：`listMarkets/getOrderBook/create/post/cancel/getOpenOrders/getTrades/getPricesHistory/getBalance`。

| Story | Title | Priority | Status | Dependencies |- [ ] 定义 `services/polymarket/ws-client.ts`：market/user 两类订阅、重连、initial_dump 聚合、退避。

|-------|-------|----------|--------|--------------|- [ ] 定义 `services/polymarket/account.ts`：余额/Allowance/开放单/成交增量/API Key/WS 健康聚合输出结构（快照 + 增量）。

| **US1** | 启动可配置的网格策略 | **P1** | 核心 MVP | Phase 1-3 |- [ ] 前端架构：RainbowKit + wagmi + viem Provider 与状态管理（React Query）；SSE 消费与缓存策略。

| **US2** | 风险控制与资金保护 | P2 | 监控与安全 | US1 + Phase 4 |- [ ] 设计 API Key 前端派生流程：前端直接调 SDK（首选）；CORS 不通时的“无持久化代理”后端中继 `/api/auth/derive`（不落盘、不打日志）。

| **US3** | 模拟/纸面交易与回测 | P3 | 优化工具 | US1 + Phase 5 |- [ ] API 契约（App Routes）：

      - `/api/markets`（SSE/REST）

**Completion Order (MVP-first)**: - `/api/strategy/[id]/config|status|history`

1. **US1** (P1): 完整网格交易闭环 → **Testable on Amoy with small budget** - `/api/account/snapshot|stream|health`

2. **US2** (P2): 风控集成 → 实盘安全性保障- [ ] 网格引擎接口：层级计算、订单映射、补挂策略、幂等键生成策略。

3. **US3** (P3): 回测与纸面 → 参数优化工具- [ ] UI 设计：统一采用 shadcn/ui 作为业务组件库；与 RainbowKit 组合使用；定义 Button/Input/Select/Card/Table/Dialog/Toast 等基元与样式规范。

**Parallel Opportunities**:## Phase 2 — Implementation（P1 核心闭环）

- Phase 1 & 2（Setup & Design）：前端 UI 与后端服务可并行开发### SDK 与后端适配

- US1 市场选取、订单簿展示、配置表单：可三个 developer 并行- [ ] 引入依赖：`@polymarket/clob-client ethers`；创建 `services/polymarket/clob-adapter.ts` 骨架。

- Phase 3（US1）与 Phase 4（US2 风控）可在 MVP 功能稳定后并行- [ ] 实现 Markets：`getMarkets/getSimplifiedMarkets` 映射为内部 `Market`，补充 `tokenIdYes/tokenIdNo/conditionId/tickSize/feeBps`。

- [ ] 实现 OrderBook：`getOrderBook(tokenID)` 映射 bids/asks 与 ts；封装 `getOrderBookHash` 做变更检测。

---- [ ] 实现 Orders：`createOrder/postOrder/postOrders/createMarketOrder/cancelOrder/cancelAll/cancelMarketOrders`（含 GTD 过期安全缓冲）。

- [ ] 实现 Queries：`getOpenOrders/getTrades/getPricesHistory/getBalanceAllowance`。

## Phase 1 — Setup & Project Initialization- [ ] 实现 `ws-client.ts`：market feed 首版；（具备 API auth 后）user feed 首版；心跳与重连退避。

> **Goal**: 初始化项目结构、依赖、开发环境 ### API Key 管理（无私钥后端持有）

> **Blocking**: 后续所有阶段- [x] 前端 `ApiKeyManager`：基于浏览器 signer 调用 SDK 的 `createOrDeriveApiKey`、`getApiKeys`、`deleteApiKey`、`revokeBuilderApiKeys`；仅会话保存。

- [x] API Key 备份与恢复：导出 JSON、从文本导入（会话保存）。

- [ ] T001 创建项目目录结构，按 plan.md 的 Project Structure 落地：`src/app`、`src/lib`、`src/services`、`src/worker`、`tests` 目录- [x] 首页模块化：在 `HomeDashboard` 嵌入 API Key 管理与账户状态；保留 `/apikey` 作为可选入口。

- [ ] T002 [P] 初始化 Next.js 16 配置：更新 `tsconfig.json`、`next.config.ts`、`package.json`（engines + scripts）- [x] 修复 ethers v6 与 clob-client 签名兼容：为 signer 补充 `_signTypedData` 适配。

- [ ] T003 [P] 安装核心依赖：`@polymarket/clob-client`、`ethers@v6`、`@rainbow-me/rainbowkit`、`wagmi`、`viem`、`@tanstack/react-query`- [x] Toast 反馈：派生/获取/吊销操作成功失败提示；链 ID 不一致提示并禁用关键操作。

- [ ] T004 [P] 安装 UI 与测试依赖：`shadcn/ui`、`tailwindcss`、`class-variance-authority`、`vitest`、`@testing-library/react`- [ ] （可选）后端 `/api/auth/derive` 中继：代理 SDK 调用，不持久化返回值，不打敏感日志；仅在 CORS 受限时启用。

- [ ] T005 初始化 shadcn/ui：运行 `npx shadcn-cli@latest init -d`，配置 Tailwind + React；在 `src/components/ui/` 生成基础组件

- [ ] T006 [P] 创建环境变量模板：`.env.example`（`NEXT_PUBLIC_CHAIN_ID`、`NEXT_PUBLIC_WS_URL`、`NEXT_PUBLIC_CLOB_API_URL` 等）### 网格引擎与 Worker

- [ ] T007 创建 README 与快速开始文档：`README.md` 包含本地开发、钱包连接、Amoy 测试网配置步骤- [ ] `lib/grid`：构建网格层级（[min,max,step]）、每层目标数量、订单映射；事件驱动补挂；库存与预算约束。

- [ ] T008 [P] 配置 Git hooks 与 CI/CD 占位：`.husky/pre-commit`、`.github/workflows/test.yml` 骨架- [ ] 幂等与重试：下单/撤单重试策略、`idempotencyKey/clientOrderId` 使用规范。

- [ ] 状态持久化：文件存储 `data/state/*.json`；原子写入与版本控制；恢复流程。

---- [ ] `worker`：单市场单方向运行器；从策略配置启动/停止；心跳与指标计数（fills/cancels/errors）。

## Phase 2 — Foundation & Service Layer Design### 前端与 API

- [ ] 前端 Provider：RainbowKit + wagmi + viem 集成，Polygon 主网/Amoy 配置。

> **Goal**: 实现 CLOB 适配层、WS 客户端、账户监控基础 - [ ] 组件：`WalletConnectButton`、`MarketSelector`、`OrderBookView`（SSE/WS 渲染）、`GridConfigForm`（提交到 API）、`StrategyStatusPanel`。

> **Blocking**: 所有用户故事 - [ ] 引入 shadcn/ui：初始化 `npx shadcn@latest init`；按需添加 `button/input/select/card/table/dialog/toast/skeleton/badge/tabs/switch/alert/separator`；替换现有临时 UI。

> **Tests**: 可选的集成测试（SDK 模拟）- [ ] 运行 `scripts/shadcn-auto-add.sh` 自动补齐缺失组件（需网络）。

- [ ] API 路由：`/api/markets`（SSE/REST）。聚合 WS（wss://.../market）后统一输出 `event: orderbook`。

### CLOB SDK Adapter- [ ] API 路由：`/api/strategy/[id]/config|status`（REST），与 worker 对接。

- [ ] 市场选取（/grid 落地真实逻辑）：

- [ ] T009 创建 `services/polymarket/types.ts`：定义 `Market`、`Order`、`GridConfig`、`Balance`、`TradeEvent` 等 TypeScript 类型 - [ ] 使用 `listMarkets/getSimplifiedMarkets` 真实拉取市场列表，展示人类可读字段（question/slug），并显示 `tickSize`、方向（YES/NO）可用性。

- [ ] T010 [P] 创建 `services/polymarket/clob-adapter.ts` 骨架：导入 `ClobClient`，定义 adapter class 和接口方法签名 - [ ] 选择市场后，基于 `tokenIdYes/tokenIdNo` 计算 `tokenID`（YES/NO）；无则通过合并 Data-API 或兼容字段补齐。

- [ ] T011 [US1] 实现 `getMarkets()` 方法：调用 SDK 的 `getMarkets()`，返回映射到内部 `Market[]` 类型，包含 `tokenIdYes/tokenIdNo/conditionId/tickSize` - [ ] 增加搜索/过滤（关键字、状态=TRADING/SETTLING）、分页或“加载更多”（若 SDK 支持 sampling 接口）。

- [ ] T012 [US1] 实现 `getOrderBook(tokenID)` 方法：调用 SDK，返回 bids/asks/timestamp，支持增量订阅检测 - [ ] 选中状态持久化到 URL（`?marketId=...&outcome=YES|NO`），刷新不丢失；加载时根据 URL 反选中。

- [ ] T013 [P] [US1] 实现 `createOrder()` 和 `postOrder()` 方法：支持 GTC/GTD，GTD 需验证过期时间 ≥ now + 10s - [ ] 使用 shadcn Skeleton 在加载/切换时展示骨架屏；Toast 告警网络错误或空列表。

- [ ] T014 [P] [US1] 实现 `cancelOrder()` 和 `cancelAll()` 方法：处理部分成交与撤单失败重试 - [ ] 成功选取后，`OrderBookView` 使用选中 `tokenID` 自动订阅 WS→SSE，`GridConfigForm` 预填 `tickSize` 并校验步长。

- [ ] T015 [US1] 实现 `getOpenOrders(market?)` 方法：查询未成交订单，返回订单 ID 列表与详情

- [ ] T016 [US1] 实现 `getTrades(market?)` 方法：查询历史成交，用于 PnL 计算与成交监听补挂### 市场获取逻辑（基于 slug 的事件模式）

- [ ] T017 [P] [US1] 实现 `getBalance()` 方法：返回 USDC/YES/NO 余额与 Allowance 状态- [ ] 读取 `polymarket-docs/fetching-markets-guide.md` 与 `polymarket-docs/event-example.json`，采用“通过指定 slug 获取 event → 基于 eventId 获取 markets”的流程。

- [ ] T018 [P] 实现 `getPricesHistory(tokenID, interval, limit)` 方法：支持 OHLCV 数据用于回测（T3 使用）- 后端（拆分路由，遵循单一职责）

  - [ ] 新增 `GET /api/event?slug={slug}`：调用 Gamma API `GET /events/slug/{slug}`，返回 event 原始结构（不统一改写）。

### WebSocket Client - [ ] 调整 `GET /api/markets?eventId={id}&closed=false`：调用 Gamma API `GET /markets?order=eventId&closed=false`，直接返回原始分页结构（data/next_cursor/limit/count），仅对 data 内部做“有效市场”过滤（存在 YES/NO token、未关闭等）。

- [ ] 出错返回 200 + `error` 字段，不抛 5xx，便于前端处理。

- [ ] T019 创建 `services/polymarket/ws-client.ts` 骨架：导入 ws 库或原生 WebSocket，定义订阅类- 前端（/grid 重构为 EventViewer）

- [ ] T020 [P] 实现 market feed 订阅：订阅 `/ws/market`，处理 `type/markets/assets_ids/initial_dump` 消息，聚合更新 - [ ] 初始不获取列表；用户在顶部输入 slug（shadcn/Input），点击“查询”或回车后：

- [ ] T021 [P] 实现用户 feed 订阅（可选 P1）：订阅 `/ws/user`，需 API auth，心跳 PING 每 50s，处理断线重连 - [ ] 请求 `/api/event?slug=...` 展示 event 详情（名称、描述、resolution、标签等）。

- [ ] T022 实现心跳与重连机制：指数退避、max 30s 间隔、手动断开支持；连接状态事件抛出 - [ ] 请求 `/api/markets?eventId={event.id}&closed=false` 展示该 event 下“有效 markets”（不再限制前 20 条）。

  - [ ] 去掉下拉菜单，直接平铺展示 markets 列表，每个 market 卡片包含 question/conditionId/YES/NO token/tickSize/status 等。

### Account Monitoring - [ ] 选择某个 market 后：

    - [ ] 在页面下方显示该 market 详情 block。

- [ ] T023 创建 `services/polymarket/account.ts`：定义 `AccountSnapshot`、`AccountStream` 接口 - [ ] 订单簿订阅使用该 market 的 `tokenID`（YES/NO），URL 持久化 `?slug=...&marketId=...&outcome=...`。

- [ ] T024 [P] 实现 `getAccountSnapshot(address)` 方法：聚合 balance/allowance/openOrders/recentTrades 返回快照 - [ ] 完善 Skeleton 加载、Toast 错误提示、空态占位，保持 shadcn/ui 统一风格。

- [ ] T025 [P] 实现 `watchAccount(address)` 方法：将 WS user feed + 轮询聚合，返回流式增量事件（balance/order/trade）- [ ] Allowance 检查：`AllowanceChecklist` 组件 + `/api/account/snapshot` 检查项（余额/Allowance/头寸）。

- [ ] T026 实现 `getAccountHealth()` 方法：检查 API Key 有效性、WS 连接、系统时钟与 chain 的偏移、限流状态- [ ] 账户面板中显示 API Key 状态（是否存在、创建时间、快速吊销）。

### Frontend Integration Prep### 校验与演示

- [ ] 最小演示路径：连接钱包 → 选择市场与方向 → 设置区间/步长/每格数量/预算 → 启动策略 → 订单簿/状态可视化 → 成交后自动补挂。

- [ ] T027 [P] 创建 `app/providers.tsx`：集成 RainbowKit（WalletConnect）、wagmi 与 viem Provider、React Query 客户端

- [ ] T028 配置 wagmi hooks：`useAccount`、`useNetwork`、`useSigner`、`useContractRead`；支持 Polygon Mainnet (137) 与 Amoy (80002)## Phase 3 — Risk & Monitoring（P2）

- [ ] T029 创建 `app/layout.tsx` 包装器：Provider 嵌套、全局样式、导航骨架- [ ] 风控规则：最大占用/最大头寸/当日亏损阈值/止损止盈/冷却；策略内统一校验并处置（撤单/停机）。

- [ ] 监控指标：PnL（含费率与滑点影响）、占用、订单失败率、补挂延迟；统一日志格式与导出。

---- [ ] 账户监控增强：`/api/account/stream`（SSE，用户 WS→ 服务端聚合）、`/api/account/health`（APIKey/WS/时钟/限流）。

- [ ] 前端：风险参数编辑、风控状态与触发历史；`AccountStatusPanel` 健康与阈值告警提示。

## Phase 3 — User Story 1 (P1): Configurable Grid Strategy

## Phase 4 — Simulation & Backtest（P3）

> **Goal**: 实现完整的网格交易闭环（配置 → 启动 → 自动维护 → 可视化） - [ ] 纸面交易执行器：复用网格引擎 + 本地撮合（基于历史价格/盘口）；不触发链上与 CLOB 下单。

> **Independent Test**: 在 Amoy 上连接钱包、选择市场、配置小预算网格、观察自动补挂行为 - [ ] 回测数据接入：优先用 `getPricesHistory`；如需更细粒度，设计导入订单簿/成交数据的方案。

> **MVP Done**: 此阶段完成 = P1 MVP 就绪 - [ ] 绩效报告：收益率/年化/最大回撤/胜率/费率与滑点影响；参数导出与一键导入实盘。

### API Key Management (Interactive Mode)## Phase 5 — Hardening（稳定性与扩展）

- [ ] 故障演练：WS 断线/限流/时钟偏移/拒单爆炸/余额不足；恢复演练与自动退避。

- [ ] T030 [US1] 创建 `app/components/ApiKeyManager.tsx`：前端派生 API Key 组件- [ ] 数据存储升级：可选 SQLite/Prisma；增加简单查询与归档。

  - 展示：API Key 列表（时间戳、标记）、派生/导入/吊销/复制/下载备份按钮- [ ] 多市场并行与限额隔离；资源与速率预算；进程/容器化部署脚本。

  - 逻辑：调用 SDK `deriveApiKey()` → 浏览器钱包签名 → 存储到 sessionStorage

  - Toast 反馈：派生成功/失败、吊销确认、Chain ID 不匹配检查## Definition of Done（阶段性交付）

- [ ] T031 实现 API Key 的 sessionStorage 管理：`lib/storage/apiKeyStore.ts`（存、取、删、查）- P1：可在 Amoy 上以小额参数完成一轮完整网格交易闭环；前端可监听市场、配置参数并查看状态；账户检查通过。

- [ ] T032 集成 ethers v6 签名兼容性：为 wagmi signer 补充 `_signTypedData` 适配器（clob-client 需要）- P2：风控命中 100% 生效；监控指标完整；账户 SSE/健康检查稳定运行。

- [ ] T033 [P] 实现可选的后端 `/api/auth/derive` 无持久化代理路由（CORS 受限时备选）- P3：回测/纸面交易可生成报告并导入实盘；主要边界条件与告警到位。

### Market Selection & Event Discovery

- [ ] T034 [US1] 创建 `app/components/EventSearchBar.tsx`：用户输入 slug，查询 `/api/event?slug=...` 获取 event 详情
- [ ] T035 [US1] 创建 `app/api/event` 路由：代理调用 Gamma API `GET /events/slug/{slug}`，返回 event 原始结构（eventId、name、description 等）
- [ ] T036 [US1] 创建 `app/components/MarketList.tsx`：展示 event 下的市场列表，每项显示 question/conditionId/YES/NO token/tickSize/status
- [ ] T037 [US1] 创建 `app/api/markets` 路由：
  - Query params: `eventId`、`closed=false`（可选）、`limit`（分页）
  - 调用 Gamma API `GET /markets?order=eventId&closed=false`（直接返回原始分页结构）
  - 对 data 做"有效市场"过滤（存在 YES/NO token、未关闭等）
  - 返回格式：`{ data: Market[], next_cursor?: string, limit, count }`
  - 出错返回 200 + `{ error: "..." }`
- [ ] T038 [US1] 创建市场选择状态管理：URL 持久化 `?slug=...&marketId=...&outcome=YES|NO`
- [ ] T039 [US1] 创建 `app/components/MarketDetails.tsx`：选中后显示市场详情（question、tickSize、token IDs、CLOB 信息）

### Order Book Visualization

- [ ] T040 [P] [US1] 创建 `app/api/markets/stream` SSE 路由：
  - 聚合 WS market feed（assets_ids 对应选中 tokenID）
  - 解析 `type: "market"` 消息，提取 bids/asks/ts
  - 以 SSE `event: orderbook` 流式推送，payload: `{ bids, asks, ts, tokenID }`
- [ ] T041 [US1] 创建 `app/components/OrderBookView.tsx`：
  - 消费 SSE `/api/markets/stream`（配合选中 tokenID）
  - 渲染 5-10 层 bids/asks，使用 shadcn Table 或简单 div 网格
  - 中间显示 mid-price；右侧显示网格配置的参考价格（若已配置）
  - 自动滚动最新数据
- [ ] T042 实现 Skeleton 加载态与错误降级：SSE 连接失败 Toast，自动重连

### Grid Configuration & Strategy Launch

- [ ] T043 [US1] 创建 `app/components/GridConfigForm.tsx`：
  - 输入字段：价格下界 (lower)、价格上界 (upper)、网格步长 (step)、每格数量 (size)、总预算 (budget)、超时 (TTL)
  - 自动计算：网格层数、单层成本、总成本占预算比例
  - shadcn 组件：Input (价格/数量/预算)、Select (TTL)、Button (校验/启动)、Alert (超额提示)
  - 校验：step ≤ (upper - lower)、size _ layers _ price ≤ budget 等
  - 显示"批准启动"确认弹窗（明确金额与风险提示）
- [ ] T044 [US1] 创建 `app/api/strategy/[id]/config` POST 路由：
  - 接收：marketId、outcome (YES/NO)、gridConfig、apiKey (from sessionStorage)
  - 验证：预算 ≤ 账户余额、预算 ≤ 预批准限额（暂为 ∞）
  - 保存配置到 `data/state/{marketId}_${outcome}.json`
  - 返回 strategy ID、初始状态
- [ ] T045 [US1] 创建后端 `worker/gridRunner.ts` 初版：
  - 输入：marketId、outcome、gridConfig、apiKey、strategy ID
  - 逻辑：计算网格层 → 调用 `postOrders()` 初始布网 → 开始事件监听循环
  - 事件循环：监听 getTrades() 增量 → 检测成交 → 自动补挂
  - 持久化：每步更新 `data/state/{strategyId}.json`（订单映射、资金占用、统计）
  - 错误处理：下单失败重试、部分成交补挂、余额不足停机告警
- [ ] T046 [US1] 创建 `app/api/strategy/[id]/status` GET 路由：
  - 返回：当前网格层状态、成交统计、资金占用、PnL（含费率影响）、运行时间
  - 数据源：从 worker 持久化的 state 文件读取
- [ ] T047 [P] [US1] 创建 `lib/grid/gridEngine.ts`：
  - `calculateLayers(lower, upper, step)` → `Layer[]` (price, targetSize, currentOrders)
  - `generateIdempotencyKey(marketId, outcome, price)` → 幂等键用于重试
  - `reconcileOrders(currentOrders, targetLayers)` → 应创建/应撤销的订单列表

### Account Status & Allowance Checklist

- [ ] T048 [US1] 创建 `app/components/AllowanceChecklist.tsx`：
  - 检查项：USDC 余额 ≥ 配置预算、USDC allowance (CTF) ≥ 预算、CTF approval for Exchange
  - 调用 `/api/account/snapshot` 获取最新状态
  - UI：shadcn Checkbox 列表，失败项红色、成功项绿色，失败项显示"Approve"按钮
  - 点击"Approve"：打开 wagmi `useContractWrite` 发起链上交易，等待确认
- [ ] T049 [US1] 创建 `app/components/AccountStatusPanel.tsx`：显示 USDC/YES/NO 余额、Allowance、开放单数、最近成交、API Key 状态、WS 连接状态
- [ ] T050 [US1] 创建 `app/api/account/snapshot` GET 路由：返回 `AccountSnapshot`（balance/allowance/openOrders/recentTrades/apiKeyStatus）

### Main Grid Page & Integration

- [ ] T051 [US1] 创建 `app/grid/page.tsx` 主页面：
  - 布局：上方钱包连接 (RainbowKit)、中上 Event 搜索与市场选择、中 OrderBook 实时展示、下 GridConfigForm、右侧 AccountStatusPanel + AllowanceChecklist
  - 流程：连接钱包 → 搜索 slug → 选择市场 → 查看订单簿 → 配置参数 → 批准并启动 → 监控运行状态
  - 使用 shadcn Layout（Card、Tabs）整洁排版
- [ ] T052 [US1] 实现完整的 E2E 演示路径（本地测试步骤）：
  - 连接钱包（MetaMask/Amoy）
  - 选择市场（例如 "Will Trump win?" YES）
  - 设置小预算网格（例如 0.01-0.02 USDC，5 层）
  - 启动 → 观察订单簿与状态面板
  - 验证：初始订单已挂、成交后补挂、余额与占用实时更新

### Testing (Optional - Unit + Integration)

- [ ] T053 [P] 单元测试：`lib/grid/gridEngine.test.ts`（层级计算、幂等键生成、订单协调逻辑）
- [ ] T054 [P] 集成测试：`services/polymarket/clob-adapter.test.ts`（SDK 调用模拟、市场数据映射）
- [ ] T055 集成测试：`worker/gridRunner.test.ts`（成交检测、补挂补偿逻辑）

**Phase 3 Definition of Done**:

- ✅ 在 Amoy 上完整演示：连接 → 选市场 → 配置 → 启动 → 看状态 → 手动成交（或等待真实成交）→ 观察自动补挂
- ✅ 订单簿实时渲染
- ✅ 账户信息与 Allowance 检查通过
- ✅ 策略配置与启动逻辑正确
- ✅ Worker 与持久化基本可用

---

## Phase 4 — User Story 2 (P2): Risk Control & Monitoring

> **Goal**: 集成风控规则、增强账户监控、完善 PnL 与指标计算  
> **Prerequisite**: Phase 3（US1）完成  
> **Independent Test**: 在运行 US1 的基础上，验证风控阈值触发时的撤单/停机行为

### Risk Control Engine

- [ ] T056 [US2] 创建 `lib/risk/riskEngine.ts`：定义风控规则类
  - 规则：maxCapital（最大占用）、maxPosition（最大头寸）、dailyLossLimit（当日亏损）、stopLoss/takeProfit（止损/止盈）、cooldownSeconds（冷却）
  - 方法：`checkRules(state: StrategyState)` → 违规列表；`executeAction(violation: Violation)` → 撤单/停机
- [ ] T057 [US2] 集成风控检查到 `worker/gridRunner.ts`：每次补挂前检查、每次成交后检查
- [ ] T058 [US2] 创建 `app/components/RiskConfigForm.tsx`：输入风控参数（maxCapital、maxPosition、dailyLossLimit 等），shadcn 组件
- [ ] T059 [US2] 扩展 `app/api/strategy/[id]/config` 支持风控参数保存与读取
- [ ] T060 [P] [US2] 实现 PnL 计算：`lib/grid/pnlCalculator.ts`
  - 基于 getTrades()、currentPositions、historicalCosts、费率
  - 返回：unrealizedPnL、realizedPnL、totalPnL、年化收益率、费率影响%

### Account Monitoring Enhancement

- [ ] T061 [US2] 创建 `app/api/account/stream` SSE 路由：
  - 聚合 WS user feed（若可用）或轮询
  - 推送增量事件：balance 变化、new order、order filled/cancelled、trade
  - 格式：`event: account`, `data: { type: "balance"|"order"|"trade", payload: {...} }`
- [ ] T062 [US2] 创建 `app/api/account/health` GET 路由：
  - 检查：API Key 有效期、WS 最后心跳时间、系统时钟与 Polygon 偏移、限流状态（从错误日志推断）
  - 返回：`{ healthy: boolean, issues: Issue[] }`
- [ ] T063 [US2] 创建 `app/components/HealthCheckDashboard.tsx`：展示账户健康状态、风控告警、最近错误
- [ ] T064 [US2] 实现风控触发历史记录：保存触发时间、规则、动作到 state 文件，前端展示时间线

### Logging & Metrics Export

- [ ] T065 [US2] 统一日志格式：`lib/logging/logger.ts`（时间戳、事件类型、市场、策略 ID、用户、消息、严重级别）
- [ ] T066 [P] [US2] 实现导出功能：`POST /api/strategy/[id]/export?format=csv|json`
  - 内容：执行历史（时间、事件、订单、成交、风控）、PnL、成交统计
  - 文件名：`strategy_{id}_{date}.{ext}`
- [ ] T067 [US2] 创建 `app/components/ExportPanel.tsx`：导出按钮 + 日期范围选择

### History & Chart Visualization

- [ ] T068 [P] [US2] 创建 `app/components/PriceChart.tsx`：基于 `getPricesHistory()` 渲染简易 K 线 或 line chart（使用 recharts 或 lightweight 库）
- [ ] T069 [US2] 创建 `app/components/TradeHistoryTable.tsx`：展示成交记录（时间、价格、数量、side、PnL）；可排序与分页

**Phase 4 Definition of Done**:

- ✅ 在 US1 基础上触发风控（例如设置低的 maxCapital）→ 观察自动撤单与停机
- ✅ 账户 SSE 流与健康检查可用
- ✅ PnL 计算准确（含费率）
- ✅ 导出与历史可用

---

## Phase 5 — User Story 3 (P3): Simulation & Backtest

> **Goal**: 实现纸面交易与回测功能  
> **Prerequisite**: Phase 3（US1）完成；Phase 4（US2）可选  
> **Independent Test**: 运行回测、导出报告、参数对比

### Paper Trading Executor

- [ ] T070 [US3] 创建 `lib/simulation/paperTrader.ts`：
  - 输入：gridConfig、历史价格流、初始余额
  - 逻辑：复用 `gridEngine` 计算层 → 基于历史价格自动撮合 → 记录虚拟订单与成交（不调用链上 API）
  - 输出：绩效报告（同实盘格式）
- [ ] T071 [US3] 创建 `app/api/strategy/backtest` POST 路由：
  - 请求体：gridConfig、marketId、outcome、startTime、endTime、initialBalance
  - 调用 `getPricesHistory()` 获取历史数据 → paperTrader 运行 → 返回报告 JSON
  - 缓存报告到 `data/backtest/{id}.json`
- [ ] T072 [US3] 创建 `app/components/BacktestForm.tsx`：
  - 输入：时间范围选择、市场、参数对比（A vs B 并排）
  - shadcn DatePicker、GridConfigForm 双份、运行按钮、进度条
- [ ] T073 [US3] 创建 `app/components/BacktestReport.tsx`：
  - 显示：总收益率、年化、最大回撤、胜率、手续费影响、每月/周 PnL breakdown
  - 支持对比两份报告（A vs B 指标并排对比）
- [ ] T074 [US3] 创建纸面交易模式页面 `app/paper-trading/page.tsx`：
  - 类似 `/grid` 但使用 PaperTrader 而非真实下单
  - 支持导入实盘参数、微调后与实盘参数对比

### Backtest & Parameter Import

- [ ] T075 [P] [US3] 实现参数导入：`POST /api/strategy/import`
  - 从回测报告的参数导入到新 strategy 配置
  - 验证参数合理性、Allowance 充足
  - 返回新 strategy ID，引导用户启动
- [ ] T076 [US3] 创建 `app/components/ParameterComparison.tsx`：
  - 列表对比两份参数（回测 vs 实盘、A vs B）
  - 高亮差异项
- [ ] T077 [US3] 实现历史数据导入（可选）：支持 CSV 上传订单簿 / 成交数据，用于离线回测

**Phase 5 Definition of Done**:

- ✅ 运行回测：选参数、时间段 → 生成报告
- ✅ 报告包含完整绩效指标
- ✅ 参数对比与一键导入实盘可用
- ✅ 纸面交易模式与实盘参数导入演示成功

---

## Phase 6 — Hardening & Deployment (Optional)

> **Goal**: 生产级稳定性、容错与扩展  
> **Prerequisite**: Phase 3 + 4 + 5 基本完成

### Resilience & Error Handling

- [ ] T078 [P] 故障演练脚本：`tests/scenarios/chaos.ts`

  - WS 断线 → 自动重连验证
  - 限流错误 → 指数退避
  - 下单拒绝 → 重试与降级
  - 余额不足 → 停机并提示
  - 时钟偏移 → 告警

- [ ] T079 [P] 前端错误边界：`app/components/ErrorBoundary.tsx`，捕获组件崩溃并显示恢复 UI
- [ ] T080 实现 SSE 断线重连与缓存恢复：持久化最后一个有效 snapshot，重连后快速恢复
- [ ] T081 增强 Worker 容错：心跳监控、异常 graceful shutdown、状态恢复验证

### Data & Persistence Upgrade

- [ ] T082 [P] (可选) 迁移到 SQLite + Prisma：`prisma/schema.prisma` 定义模型（Strategy、Order、Trade、RiskEvent）
- [ ] T083 (可选) 数据归档脚本：完成策略 → 压缩历史数据 → S3 备份
- [ ] T084 (可选) 快照恢复工具：从归档快照恢复中断策略

### Deployment & Scaling

- [ ] T085 [P] Docker 容器化：`Dockerfile` for Worker、`docker-compose.yml` for local dev
- [ ] T086 Kubernetes 部署清单（可选）：`k8s/deployment.yaml`、`k8s/service.yaml`
- [ ] T087 监控与告警集成：Prometheus metrics export、告警规则（失败率、延迟、风控触发）
- [ ] T088 水平扩展支持：多实例 Worker 协调、市场分片、速率限制共享存储

---

## Implementation Strategy & Execution Plan

### MVP Scope (Phase 3 Complete = P1 Deliverable)

**Timeline**: Estimated 4-6 weeks (1 developer full-time)

```
Week 1-2:  T001-T032  Setup + Service Layer + API Key Mgmt
Week 2-3:  T033-T051  Event Discovery + Market Selection + OrderBook + Grid Form
Week 3-4:  T052-T055  Main Integration + Testing
Week 4-5:  Demo on Amoy + Bugfixes
```

### Parallel Execution Example (US1 with 3 developers)

```
Developer A: Event Discovery & Market Selection (T034-T039)
Developer B: OrderBook & Grid Form (T040-T047, T051)
Developer C: API Key Mgmt & Account Status (T030-T050)
      All: Worker & Integration (T045-T052) — coordinate async/events
```

### Incremental Rollout

1. **Week 1-2**: Internal testing on Amoy with team wallets
2. **Week 3**: Public beta (small group, low budget)
3. **Week 4+**: Mainnet launch + P2 Risk Control rollout
4. **Month 2+**: P3 Backtest & P6 Hardening (optional)

---

## Quality & Definition of Done

### Per-Phase Done Criteria

| Phase             | Criteria                                                                            |
| ----------------- | ----------------------------------------------------------------------------------- |
| Phase 1           | ✅ All dependencies installed, build succeeds, dev server runs                      |
| Phase 2           | ✅ CLOB adapter unit tests pass, WS mock subscriptions work, Account SSE flows data |
| **Phase 3 (US1)** | **✅ E2E demo: Connect → Select → Configure → Launch → Monitor on Amoy**            |
| Phase 4 (US2)     | ✅ Risk rules trigger correctly, PnL accurate, export works                         |
| Phase 5 (US3)     | ✅ Backtest runs, report generated, parameter import works                          |
| Phase 6           | ✅ Chaos tests pass, Prometheus metrics export, K8s deploy succeeds                 |

### Test Coverage Targets

- **Phase 1-2**: 70% coverage (adapters, services)
- **Phase 3**: 80% coverage (grid engine, worker logic)
- **Phase 4**: 85% coverage (risk engine, PnL calculator)
- **Phase 5**: 75% coverage (paper trader, backtest)

---

## Task Checklist Format Reference

All tasks follow this format:

```
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Examples in this file**:

- ✅ `- [ ] T001 创建项目目录结构` (Setup, no story label)
- ✅ `- [ ] T030 [US1] 创建 `app/components/ApiKeyManager.tsx`` (Story-specific)
- ✅ `- [ ] T011 [US1] 实现 `getMarkets()` 方法` (Story + Service impl)
- ✅ `- [ ] T040 [P] [US1] 创建 `app/api/markets/stream` SSE 路由` (Parallelizable)

---

## Notes & Assumptions

- **Wallet Support**: RainbowKit 支持 MetaMask、WalletConnect、Ledger 等主流钱包；Amoy 与 Mainnet 自动切换
- **CLOB SDK Version**: 假设 `@polymarket/clob-client@latest` 支持 EIP-712 签名与 API Key 认证；如不支持需 shim
- **Data Persistence**: Phase 1-5 使用文件存储（`data/state/*.json`）；Phase 6 可选升级 SQLite
- **Frontend Framework**: Next.js 16 App Router；shadcn/ui 作为所有业务组件基础；不允许零散手写样式
- **Testing**: 单元测试 optional（TDD 非强制），集成测试推荐；E2E 主要通过手动演示验证

---

**Last Updated**: 2025-11-03  
**Status**: Ready for Sprint Planning  
**Contact**: Refer to COMPLETION_REPORT.md for clarifications on FR-011 & Phase 2
