# Tasks: Polymarket 自动化网格交易平台

> 依据 spec.md 与 plan.md 拆解的可执行任务清单。任务按阶段划分，默认优先完成 P1（网格引擎 + CLOB 适配 + 前端监听/配置）。

## Phase 0 — Research（接口与安全）
- [ ] 梳理 CLOB SDK 能力矩阵：下单/撤单/批量、GTD 过期规则（≥now+10s）、市价单 FOK/FAK、开单限额/速率限制。
- [ ] 确认签名路径：EOA 与（可选）Proxy/Gnosis；前端 EIP‑712 是否由 SDK 生成 payload（或后端生成、前端签名）。
- [ ] 明确 WS 订阅：`/ws/market` 与 `/ws/user` 的消息结构、initial_dump、心跳 PING、断线重连策略与速率限制。
- [ ] 账户权限与授权：USDC→CTF/Exchange allowance，CTF `setApprovalForAll(exchange,true)`；形成检查清单。
- [ ] 环境变量与密钥清单：`CLOB_API_URL/WS_URL/CLOB_API_KEY/CLOB_SECRET/CLOB_PASS_PHRASE/CHAIN_ID` 等；前端 `NEXT_PUBLIC_*`。
- [ ] 数据模型校验：对齐 `tokenID/conditionId/OrderType` 与 SDK；更新 data-model.md 差异清单（若有）。

## Phase 1 — Design（契约与结构）
- [ ] 定义 `services/polymarket/clob-adapter.ts` 接口：`listMarkets/getOrderBook/create/post/cancel/getOpenOrders/getTrades/getPricesHistory/getBalance`。
- [ ] 定义 `services/polymarket/ws-client.ts`：market/user 两类订阅、重连、initial_dump 聚合、退避。
- [ ] 定义 `services/polymarket/account.ts`：余额/Allowance/开放单/成交增量/API Key/WS 健康聚合输出结构（快照 + 增量）。
- [ ] 前端架构：RainbowKit + wagmi + viem Provider 与状态管理（React Query）；SSE 消费与缓存策略。
- [ ] 设计 API Key 前端派生流程：前端直接调 SDK（首选）；CORS 不通时的“无持久化代理”后端中继 `/api/auth/derive`（不落盘、不打日志）。
- [ ] API 契约（App Routes）：
      - `/api/markets`（SSE/REST）
      - `/api/strategy/[id]/config|status|history`
      - `/api/account/snapshot|stream|health`
- [ ] 网格引擎接口：层级计算、订单映射、补挂策略、幂等键生成策略。
- [ ] UI 设计：统一采用 shadcn/ui 作为业务组件库；与 RainbowKit 组合使用；定义 Button/Input/Select/Card/Table/Dialog/Toast 等基元与样式规范。

## Phase 2 — Implementation（P1 核心闭环）
### SDK 与后端适配
- [ ] 引入依赖：`@polymarket/clob-client ethers`；创建 `services/polymarket/clob-adapter.ts` 骨架。
- [ ] 实现 Markets：`getMarkets/getSimplifiedMarkets` 映射为内部 `Market`，补充 `tokenIdYes/tokenIdNo/conditionId/tickSize/feeBps`。
- [ ] 实现 OrderBook：`getOrderBook(tokenID)` 映射 bids/asks 与 ts；封装 `getOrderBookHash` 做变更检测。
- [ ] 实现 Orders：`createOrder/postOrder/postOrders/createMarketOrder/cancelOrder/cancelAll/cancelMarketOrders`（含 GTD 过期安全缓冲）。
- [ ] 实现 Queries：`getOpenOrders/getTrades/getPricesHistory/getBalanceAllowance`。
- [ ] 实现 `ws-client.ts`：market feed 首版；（具备 API auth 后）user feed 首版；心跳与重连退避。

### API Key 管理（无私钥后端持有）
- [x] 前端 `ApiKeyManager`：基于浏览器 signer 调用 SDK 的 `createOrDeriveApiKey`、`getApiKeys`、`deleteApiKey`、`revokeBuilderApiKeys`；仅会话保存。
- [x] API Key 备份与恢复：导出 JSON、从文本导入（会话保存）。
- [x] 首页模块化：在 `HomeDashboard` 嵌入 API Key 管理与账户状态；保留 `/apikey` 作为可选入口。
- [x] 修复 ethers v6 与 clob-client 签名兼容：为 signer 补充 `_signTypedData` 适配。
- [x] Toast 反馈：派生/获取/吊销操作成功失败提示；链 ID 不一致提示并禁用关键操作。
- [ ] （可选）后端 `/api/auth/derive` 中继：代理 SDK 调用，不持久化返回值，不打敏感日志；仅在 CORS 受限时启用。

### 网格引擎与 Worker
- [ ] `lib/grid`：构建网格层级（[min,max,step]）、每层目标数量、订单映射；事件驱动补挂；库存与预算约束。
- [ ] 幂等与重试：下单/撤单重试策略、`idempotencyKey/clientOrderId` 使用规范。
- [ ] 状态持久化：文件存储 `data/state/*.json`；原子写入与版本控制；恢复流程。
- [ ] `worker`：单市场单方向运行器；从策略配置启动/停止；心跳与指标计数（fills/cancels/errors）。

### 前端与 API
- [ ] 前端 Provider：RainbowKit + wagmi + viem 集成，Polygon 主网/Amoy 配置。
- [ ] 组件：`WalletConnectButton`、`MarketSelector`、`OrderBookView`（SSE/WS 渲染）、`GridConfigForm`（提交到 API）、`StrategyStatusPanel`。
- [ ] 引入 shadcn/ui：初始化 `npx shadcn@latest init`；按需添加 `button/input/select/card/table/dialog/toast/skeleton/badge/tabs/switch/alert/separator`；替换现有临时 UI。
- [ ] 运行 `scripts/shadcn-auto-add.sh` 自动补齐缺失组件（需网络）。
- [ ] API 路由：`/api/markets`（SSE/REST）。聚合 WS（wss://.../market）后统一输出 `event: orderbook`。
- [ ] API 路由：`/api/strategy/[id]/config|status`（REST），与 worker 对接。
- [ ] 市场选取（/grid 落地真实逻辑）：
  - [ ] 使用 `listMarkets/getSimplifiedMarkets` 真实拉取市场列表，展示人类可读字段（question/slug），并显示 `tickSize`、方向（YES/NO）可用性。
  - [ ] 选择市场后，基于 `tokenIdYes/tokenIdNo` 计算 `tokenID`（YES/NO）；无则通过合并 Data-API 或兼容字段补齐。
  - [ ] 增加搜索/过滤（关键字、状态=TRADING/SETTLING）、分页或“加载更多”（若 SDK 支持 sampling 接口）。
  - [ ] 选中状态持久化到 URL（`?marketId=...&outcome=YES|NO`），刷新不丢失；加载时根据 URL 反选中。
  - [ ] 使用 shadcn Skeleton 在加载/切换时展示骨架屏；Toast 告警网络错误或空列表。
  - [ ] 成功选取后，`OrderBookView` 使用选中 `tokenID` 自动订阅 WS→SSE，`GridConfigForm` 预填 `tickSize` 并校验步长。

### 市场获取逻辑（基于 slug 的事件模式）
- [ ] 读取 `polymarket-docs/fetching-markets-guide.md` 与 `polymarket-docs/event-example.json`，采用“通过指定 slug 获取 event → 基于 eventId 获取 markets”的流程。
- 后端（拆分路由，遵循单一职责）
  - [ ] 新增 `GET /api/event?slug={slug}`：调用 Gamma API `GET /events/slug/{slug}`，返回 event 原始结构（不统一改写）。
  - [ ] 调整 `GET /api/markets?eventId={id}&closed=false`：调用 Gamma API `GET /markets?order=eventId&closed=false`，直接返回原始分页结构（data/next_cursor/limit/count），仅对 data 内部做“有效市场”过滤（存在 YES/NO token、未关闭等）。
  - [ ] 出错返回 200 + `error` 字段，不抛 5xx，便于前端处理。
- 前端（/grid 重构为 EventViewer）
  - [ ] 初始不获取列表；用户在顶部输入 slug（shadcn/Input），点击“查询”或回车后：
    - [ ] 请求 `/api/event?slug=...` 展示 event 详情（名称、描述、resolution、标签等）。
    - [ ] 请求 `/api/markets?eventId={event.id}&closed=false` 展示该 event 下“有效 markets”（不再限制前 20 条）。
  - [ ] 去掉下拉菜单，直接平铺展示 markets 列表，每个 market 卡片包含 question/conditionId/YES/NO token/tickSize/status 等。
  - [ ] 选择某个 market 后：
    - [ ] 在页面下方显示该 market 详情 block。
    - [ ] 订单簿订阅使用该 market 的 `tokenID`（YES/NO），URL 持久化 `?slug=...&marketId=...&outcome=...`。
  - [ ] 完善 Skeleton 加载、Toast 错误提示、空态占位，保持 shadcn/ui 统一风格。
- [ ] Allowance 检查：`AllowanceChecklist` 组件 + `/api/account/snapshot` 检查项（余额/Allowance/头寸）。
- [ ] 账户面板中显示 API Key 状态（是否存在、创建时间、快速吊销）。

### 校验与演示
- [ ] 最小演示路径：连接钱包 → 选择市场与方向 → 设置区间/步长/每格数量/预算 → 启动策略 → 订单簿/状态可视化 → 成交后自动补挂。

## Phase 3 — Risk & Monitoring（P2）
- [ ] 风控规则：最大占用/最大头寸/当日亏损阈值/止损止盈/冷却；策略内统一校验并处置（撤单/停机）。
- [ ] 监控指标：PnL（含费率与滑点影响）、占用、订单失败率、补挂延迟；统一日志格式与导出。
- [ ] 账户监控增强：`/api/account/stream`（SSE，用户 WS→服务端聚合）、`/api/account/health`（APIKey/WS/时钟/限流）。
- [ ] 前端：风险参数编辑、风控状态与触发历史；`AccountStatusPanel` 健康与阈值告警提示。

## Phase 4 — Simulation & Backtest（P3）
- [ ] 纸面交易执行器：复用网格引擎 + 本地撮合（基于历史价格/盘口）；不触发链上与 CLOB 下单。
- [ ] 回测数据接入：优先用 `getPricesHistory`；如需更细粒度，设计导入订单簿/成交数据的方案。
- [ ] 绩效报告：收益率/年化/最大回撤/胜率/费率与滑点影响；参数导出与一键导入实盘。

## Phase 5 — Hardening（稳定性与扩展）
- [ ] 故障演练：WS 断线/限流/时钟偏移/拒单爆炸/余额不足；恢复演练与自动退避。
- [ ] 数据存储升级：可选 SQLite/Prisma；增加简单查询与归档。
- [ ] 多市场并行与限额隔离；资源与速率预算；进程/容器化部署脚本。

## Definition of Done（阶段性交付）
- P1：可在 Amoy 上以小额参数完成一轮完整网格交易闭环；前端可监听市场、配置参数并查看状态；账户检查通过。
- P2：风控命中 100% 生效；监控指标完整；账户 SSE/健康检查稳定运行。
- P3：回测/纸面交易可生成报告并导入实盘；主要边界条件与告警到位。
