# Implementation Plan: Polymarket 自动化网格交易平台

**Branch**: `001-polymarket-grid-bot` | **Date**: 2025-11-03 | **Spec**: `specs/001-polymarket-grid-bot/spec.md`
**Input**: Feature specification from `specs/001-polymarket-grid-bot/spec.md`

**Note**: This plan focuses on P1 (Interactive Mode) - canceling autonomous mode entirely. Users configure and approve strategy launch in frontend; backend executes within pre-approved budget limits using API Key stored in frontend.

## Summary

实现在 Polymarket 上运行的自动化网格交易系统，支持：
- **P1 交互模式**：用户在前端通过浏览器钱包派生 API Key，配置网格参数与预算限额，明确批准启动；后端基于预批准的 API Key 和预算限额自动执行网格交易与补挂（无需每单用户签名）。
- **风控集成**（P2）：资金占用、头寸、亏损阈值、止损/止盈、冷却等规则，自动撤单/停机。
- **纸面交易/回测**（P3）：评估参数组合表现。

**P1 核心承诺**：
- ✅ 永不在后端存储/接触钱包私钥。
- ✅ 用户手动使用浏览器钱包签名派生 API Key。
- ✅ API Key 存储在前端（会话内存/sessionStorage），用于后端执行预批准交易。
- ✅ 后端在用户预设的预算限额内自动执行，不进行自主决策。
- ❌ **取消自主模式**：不支持后端自主生成密钥、独立修改参数、或无用户批准的自主行为。

## Technical Context

**Language/Version**: TypeScript (Node.js 18+), Next.js 16  
**Primary Dependencies**: Next.js（UI/配置），`@rainbow-me/rainbowkit` + `wagmi` + `viem`（多钱包支持），`@polymarket/clob-client`（CLOB 市场/下单 SDK），`shadcn/ui`（UI 组件），轻量任务调度（自研轮询或 `bullmq`）  
**Storage**: 初期文件型持久化（`data/state/*.json`），可升级 SQLite（Prisma）  
**Testing**: Vitest（单元/集成），可选 Playwright（端到端）  
**Target Platform**: 后台 Worker（长驻进程/容器），Next.js 前端（支持 Polygon Mainnet 137 与 Amoy 80002）
**Project Type**: 单体仓库（Next 前端 + 服务模块）  
**Performance Goals**: 订单事件处理延迟 < 500ms；补挂延迟 < 2s；前端页面刷新/渲染 p95 < 300ms；启动布网 < 10s；7×24 稳定运行  
**Constraints**: 费用/滑点可控，异常可快速恢复；无状态 API 与有状态 Worker 分离；遵守 CLOB 限流/签名/序列约束；前端实时性通过 SSE/WS 保障；用户显式确认所有关键操作（钱包签名 → API Key 派生、策略启动、参数变更、停止等）
**Scale/Scope**: 单实例支撑 5–10 个并发市场（P1 可水平扩展）

### Security Model - P1 Interactive Mode Only（取消自主模式）

- **永不在后端存储私钥**：通过浏览器钱包（RainbowKit + wagmi + viem）实现 EIP-1193/EIP-712 用户签名。
- **P1 交互模式**（仅此模式）：
  - 用户在前端连接浏览器钱包。
  - 用户调用 SDK `createOrDeriveApiKey()` 或 `deriveApiKey()`，通过浏览器钱包签名生成 API Key（`{ key, secret, passphrase }`）。
  - API Key 存储在前端（会话内存或 sessionStorage）；提供"复制/下载加密备份"选项；**永不回传到后端持久化**。
  - 用户配置网格参数（价格区间、步长、每格数量、预算、风控阈值）并**明确批准**启动。
  - 后端 Worker 使用前端传入的预批准 API Key 和参数在预算限额内自动执行下单与补挂。
  - 所有关键变更（API Key 轮换、参数调整、预算修改、策略停止）需用户前端显式确认。
  
- **后端约束**（确保无自主权）：
  - 不生成、存储或派生任何密钥。
  - 不独立修改网格参数、预算或风控阈值。
  - 仅在满足用户预批准条件时执行下单与补挂。
  - 不支持"自主模式"：无后端自主决策、无无人值守签名、无绕过用户批准的行为。

### API Key 生命周期（前端主导）

- **派生**：前端调 `deriveApiKey()` → 用户浏览器钱包签名 → SDK 返回 `{ key, secret, passphrase }` → 存储在会话内存。
- **查看/管理**：前端 `ApiKeyManager` 组件调 `getApiKeys()` 查看历史密钥，支持吊销 `deleteApiKey()` 与重新派生。
- **使用**：后端接收前端传来的预批准 API Key，用于订单提交；不接收私钥，不进行派生。
- **限制**：如浏览器 CORS 受限，提供后端 `/api/auth/derive` 无持久化代理（仅中转，不落盘，不打日志）。

### CLOB SDK 关键能力

- `ClobClient(host, chainId, wallet?, apiCreds?, signatureType?, funder?)`：支持 API Key 认证。
- 下单：`createOrder()` + `postOrder()` 或一步法 `createAndPostOrder()`；支持 GTC/GTD/FAK/FOK。
- 订单簿：`getOrderBook(tokenID)`；市场：`getMarkets()/getSimplifiedMarkets()`。
- 查询：`getOpenOrders()`、`getTrades()`、`getPricesHistory()`。
- WS：`wss://ws-subscriptions-clob.polymarket.com/ws/market|user`，支持心跳 & 重连。
- 余额/授权：需链上 USDC allowance（对 CTF 与 Exchange）与 CTF `setApprovalForAll(exchange, true)`。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- 当前仓库遵循简洁、可测试、可观测三原则。
- P1 承诺：**永不在后端存储私钥；仅交互模式；用户前置批准；API Key 前端派生与存储**。
- **所有后端自主决策与无人值守模式永远不进 P1**。任何自主特性都明确标记为 P3 可选探索。

## Project Structure

### Documentation (this feature)

```text
specs/001-polymarket-grid-bot/
├── plan.md              # 本文件（Implementation Plan）
├── research.md          # Phase 0 输出（Research & Findings）
├── data-model.md        # Phase 1 输出（Data Model & Entities）
├── quickstart.md        # Phase 1 输出（Quick Start Guide）
├── contracts/           # Phase 1 输出（API & Service Contracts）
└── tasks.md             # Phase 2 输出（Detailed Task Breakdown）
```

### Source Code (repository root)

```text
src/
├── app/                       # Next.js UI (App Router)
│   ├── grid/                  # 网格策略主页面
│   │   └── page.tsx
│   ├── api/                   # App Route API (SSE/REST)
│   │   ├── markets/route.ts   # 市场列表 & 行情流
│   │   ├── account/           # 账户状态聚合
│   │   │   ├── snapshot/route.ts
│   │   │   ├── stream/route.ts
│   │   │   └── health/route.ts
│   │   └── strategy/[id]/     # 策略配置/状态/历史
│   │       ├── config/route.ts
│   │       ├── status/route.ts
│   │       └── history/route.ts
│   └── components/
│       ├── MarketSelector.tsx       # 市场与方向选择
│       ├── OrderBookView.tsx        # 订单簿可视化
│       ├── GridConfigForm.tsx       # 网格参数配置 & 用户批准
│       ├── StrategyStatusPanel.tsx  # 策略运行状态展示
│       ├── TradeHistoryTable.tsx    # 成交历史表格
│       ├── AccountStatusPanel.tsx   # 余额/仓位/Allowance/健康指示
│       ├── AllowanceChecklist.tsx   # 链上授权引导与校验
│       ├── WalletConnectButton.tsx  # 钱包连接（RainbowKit）
│       ├── ApiKeyManager.tsx        # API Key 派生/查看/吊销（前端会话存储）
│       └── ui/                      # shadcn/ui 基础组件库
├── lib/
│   ├── grid/                  # 网格引擎（层级计算、订单映射、补挂策略）
│   ├── persistence/           # 状态持久化（file/SQLite 适配）
│   ├── risk/                  # 风控规则与评估引擎
│   └── utils/                 # 公共工具函数
├── services/
│   └── polymarket/            # Polymarket 市场与订单适配层
│       ├── clob-adapter.ts    # @polymarket/clob-client 封装（仅预批准下单）
│       ├── ws-client.ts       # WS 订阅（market/user），支持重连 & 聚合
│       └── account.ts         # 账户状态聚合（余额/Allowance/开放单/成交/API Key/WS 健康）
├── worker/
│   ├── gridRunner.ts          # 单市场单方向策略执行器
│   └── registry.ts            # 策略注册表与生命周期管理
└── cli/                       # 本地启动/管理命令

tests/
├── unit/                      # 单元测试
├── integration/               # 集成测试
└── contract/                  # 接口契约与模拟
```

**Structure Decision**: 采用单仓单项目结构（Next.js 前端 + 服务模块）。前端（`app/`）负责 UI、钱包集成、API Key 派生与用户批准；服务层（`services/`）通过 CLOB SDK 与 Polymarket 交互（仅预批准操作）；Worker（`worker/`）自动执行预批准的网格策略。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 长驻 Worker | 及时响应成交与补挂事件，维持网格密度 | 仅定时任务无法保证时效与一致性；轮询间隔过长导致成交延迟 |
| 状态持久化 | 崩溃后无损恢复策略状态、订单映射、资金占用 | 纯内存状态丢失风险极高，无法通过监管与审计 |
| 前端 API Key 存储 | 避免后端接触私钥，满足安全与监管要求 | 后端持久化密钥/秘文违反零知识原则，增加黑客攻击面 |

## Phased Plan

### Phase 0: Research（Outline & Research）

**目标**：明确 CLOB 能力、前端实时通道、安全模型与 API Key 派生流程。

**Research Tasks**：
1. 确认 `@polymarket/clob-client` 版本与能力：
   - 市场数据查询（`getMarkets()`, `getOrderBook()`）
   - 订单管理（`createOrder()`, `postOrder()`, `cancelOrder()`）
   - 批量操作与幂等下单
   - 认证方式（API Key + 签名类型）
   - 限流与重试策略
   
2. 明确费用模型、最小价位（tick size）、撮合细节（部分成交、撤单失败）。

3. 确定前端实时通道：
   - SSE vs WS vs 轮询的权衡
   - CORS 兼容性与浏览器打包
   - `getPricesHistory()` 与历史数据可用性

4. **API Key 派生验证**：
   - `deriveApiKey()` / `createOrDeriveApiKey()` 是否支持浏览器钱包签名（EIP-712）
   - 后端是否能无持久化地中转派生请求
   - 安全模型：预料中的密钥轮换周期、吊销机制

5. 账户监控需求：
   - 需要监控的指标清单（USDC/YES/NO、Allowance、开放单、成交、API Key 有效性、WS 心跳、限流）
   - 实时告警阈值与处置动作

**Outputs**：
- `research.md`：上述所有问题的决策与基本原理
- CLOB 适配契约草案
- 前端实时数据方案与环境变量清单
- 安全模型与权限矩阵
- Allowance 授权指南

---

### Phase 1: Design（Design & Contracts）

**先决条件**：`research.md` 完成。

**设计任务**：

1. **数据模型** → `data-model.md`：
   - Market、GridConfig、GridLevel、Order、Position、Balance、TradeEvent、RiskRule、StrategyState
   - 状态转移与持久化边界
   - 运行模式（实盘/纸面/回测）与隔离

2. **API 契约** → `contracts/`：
   - REST：`GET /api/markets`, `POST /api/strategy/:id/config`, `GET /api/account/snapshot` 等
   - SSE：`/api/markets/stream`, `/api/account/stream`
   - WS（可选直连）：user feed 订阅与 market feed 聚合

3. **前端设计**：
   - 组件状态管理（React Query / Zustand）
   - 钱包集成流程（RainbowKit → signer → API Key 派生 → sessionStorage）
   - 用户批准流程：配置 → 确认启动 → 参数变更 → 停止（每步明确弹窗）

4. **后端设计**：
   - Worker 架构：单市场单方向实例，状态隔离
   - 预批准参数传入机制（前端 POST，后端验证与执行范围）
   - 错误处理与恢复（超时、部分成交、余额不足）

5. **账户监控契约** → `account.ts`：
   - 快照 API（`/api/account/snapshot`）与增量事件流（`/api/account/stream`）
   - 健康检查端点（`/api/account/health`）

**Outputs**：
- `data-model.md`：完整数据模型与转移
- `quickstart.md`：快速开始指南（钱包连接 → API Key 派生 → 配置网格 → 启动）
- `contracts/`：OpenAPI 或文本契约
- UI 线框（前端批准流程、状态展示、风控告警）

---

### Phase 2: Implementation (P1) — Interactive Mode Only, No Autonomous Mode

**核心承诺**：
- ✅ 永不后端存储私钥；API Key 前端派生与会话存储
- ✅ 用户手动通过浏览器钱包签名，获取 API Key
- ✅ 后端在用户预批准的预算限额内执行
- ✅ 所有关键操作需用户前端显式确认
- ❌ 取消所有自主模式特性（后端自主生成密钥、独立修改参数、无人值守）

**实现任务**：

1. **API Key 生命周期管理**（优先）：
   - 前端 `ApiKeyManager` 组件：调 SDK `deriveApiKey()` → 用户浏览器钱包签名 → 存储到 sessionStorage
   - 支持查看、复制、下载加密备份、吊销、重新派生
   - 可选后端 `/api/auth/derive` 无持久化代理（仅中转，不打日志）

2. **Polymarket 适配层** → `services/polymarket/clob-adapter.ts`：
   - 基于 `@polymarket/clob-client` 封装
   - 仅启用预批准下单（`postOrder(order, apiCreds)`）
   - 不暴露后端自主生成密钥的任何方法
   - 只读方法：`listMarkets()`, `getOrderBook()`, `getOpenOrders()`, `getTrades()`

3. **网格引擎初版** → `lib/grid/`：
   - 层级计算：给定价格区间 & 步长 → 生成网格层列表
   - 订单映射：记录订单 ID ↔ 网格层的关系
   - 补挂策略：成交时自动在相应层补单
   - 处理部分成交、幂等下单、TIF 与滑点保护

4. **Worker 执行器** → `worker/gridRunner.ts`：
   - 单市场单方向策略实例
   - 输入：预批准的 API Key、网格参数、预算限额、风控规则
   - 逻辑：初始布网 → 监听成交 → 自动补挂 → 风控检查
   - 输出：日志、指标、订单事件、持久化状态
   - 严格遵守预算限额与预批准参数，不独立决策

5. **前端主页面** → `app/grid/page.tsx` & 组件：
   - `MarketSelector`：选择市场与方向
   - `GridConfigForm`：输入价格区间、步长、每格数量、预算、风控参数 + **"批准启动"确认按钮**
   - `OrderBookView`：实时订单簿展示（SSE）
   - `StrategyStatusPanel`：策略运行状态、成交统计、PnL、资金占用
   - `AccountStatusPanel`：账户余额、仓位、Allowance、开放单、WS 健康
   - `ApiKeyManager`：API Key 派生、查看、吊销

6. **钱包集成**（交互模式）：
   - RainbowKit + wagmi + viem：支持多钱包、自动链切换（Polygon Mainnet 137 / Amoy 80002）
   - EIP-712 签名流程：用户批准 API Key 派生、授权 USDC allowance
   - 明确显示签名请求与确认提示

7. **实时数据通道**：
   - `ws-client.ts`：订阅市场与用户 WS 流
   - `app/api/markets/route.ts`：聚合市场数据 → SSE 推送
   - `app/api/account/snapshot` & `stream`：账户状态快照 & 增量事件

8. **账户监控首版** → `AccountStatusPanel` & `app/api/account/*`：
   - 轮询 `getBalanceAllowance()`、`getOpenOrders()`
   - 订阅用户 WS 流（若可用）
   - 显示：USDC 余额、仓位（YES/NO）、Allowance 状态、开放单数、最近成交、API Key 状态、告警

9. **持久化** → `lib/persistence/`：
   - 文件型（`data/state/{marketId}.json`）：策略状态、订单映射、资金占用、风险状态
   - 接口适配，便于后续升级 SQLite

10. **日志与指标**：
    - 标准化日志格式：时间戳、事件类型、市场、策略 ID、成交/撤单/风控动作
    - 导出 CSV/JSON：执行历史、PnL、成交统计

**不包含**（推迟到 P3）：
- 自主模式：后端生成密钥、独立修改参数、无人值守执行
- 多市场轮动、跨市场资金调度
- 高级风控（ML 预测、自适应参数）
- 回测与纸面交易

---

### Phase 3: Risk & Monitoring (P2)

- 风控规则执行、冷却与停机流程
- 滑点/费用保护、监控面板与告警钩子
- 历史数据（`getPricesHistory()`, `getTrades()`）与可视化
- 前端风控参数编辑、状态与触发历史展示
- 安全加固：签名域分离、防重放、速率限制、审核日志

### Phase 4: Simulation & Backtest (P3)

- 纸面交易执行器
- 历史数据读取与回测指标
- 报告导出与参数导入实盘

### Phase 5: Hardening (可选)

- 恢复演练、故障注入测试
- 持久化升级路线（SQLite/Prisma）
- 前端 SSE 断线重连、错误边界、骨架屏优化
