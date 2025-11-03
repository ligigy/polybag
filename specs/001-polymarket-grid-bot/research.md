# Research: Polymarket 自动化网格交易平台

## Goals
- 明确可用的数据与交易接口：市场列表、订单簿、账户、下单/撤单、费用与结算。
- 确定签名/密钥与链路：钱包适配（本地私钥/浏览器钱包/托管），Polygon RPC 选择与速率。
- 量化费用/滑点与最小变动价位，形成网格参数与收益/风险框架。

## Open Questions (NEEDS CLARIFICATION)
- `@polymarket/clob-client` 鉴权方式与所需环境变量（API key、私钥/助记词、账户域）。
- CLOB 接口限流/重试建议、序列号/幂等键/签名时效处理。
- 历史数据：如何获取可回测的逐笔/盘口快照数据？数据许可与体量？
- 钱包与金库：运行环境中的私钥管理方式与安全策略？
- 前端钱包（EIP-1193/EIP-712）能否直接对订单进行签名并被 CLOB 接受？是否需要后端中继？
- 是否存在 API-Key-only 的下单路径（无需每单签名）以支持无人值守？如无，是否支持受限委托/会话密钥？
- 前端接入：优先选 `wagmi+viem` 与 RainbowKit / WalletConnect；是否有与 CLOB 兼容的 EIP-712 订单结构或需由 SDK 生成？
- 前端派生 API Key：`createOrDeriveApiKey()` 是否支持浏览器直接调用（打包 + CORS）；返回的 `secret/passphrase` 是否可设置有效期/权限范围？

## Initial Findings (to be validated)
- 使用 `@polymarket/clob-client` 作为主要市场/下单 SDK；`ethers` 用于签名与链上余额/批准等。
- 优先实现安全的轮询+幂等下单/撤单；若 SDK 提供 WS 订阅再评估引入。
- 前端采用钱包插件发起用户确认的签名；后台避免持有私钥。若需 7×24 自主下单，需确认 API Key 或委托能力。

## Risks
- 市场/订单接口变更或限流，影响实时性与稳定性。
- 手续费、滑点与结算不确定性导致预期收益偏差。
- 私钥/签名管理安全。

## Deliverables
- CLOB 客户端集成方案与所需环境变量（`CLOB_API_URL`, `CLOB_API_KEY`, `WALLET_PRIVATE_KEY`, `POLYGON_RPC_URL` 等）。
- 数据契约初稿（contracts/），含 CLOB 适配接口签名。
- 运行与安全建议（前端钱包签名流程、RPC、重试/回退策略、限流与幂等、签名域/nonce/重放防护）。
- 前端钱包选型与初始化指南（Wagmi/RainbowKit/Web3Modal 对比、EIP-6963 多注入策略）。
- API Key 前端派生指南：纯前端流程与“无持久化代理”备选；会话存储与吊销/轮换策略。
