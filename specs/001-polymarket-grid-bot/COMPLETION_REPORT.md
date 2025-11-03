# 📋 Polymarket 自动化网格交易平台 — 规范与计划完成报告

**日期**：2025-11-03  
**功能分支**：`001-polymarket-grid-bot`  
**状态**：✅ **规范与计划已完成，可推进 Phase 0 研究**

---

## 📌 执行摘要

根据 `speckit.specify.prompt.md` 和 `speckit.plan.prompt.md` 指引，已完成以下工作：

### ✅ 已完成的关键更新

1. **FR-011 认证与密钥管理 — 明确化**

   - **状态**：从 [NEEDS CLARIFICATION] → 具体设计
   - **决策**：
     - ✅ 永不在后端存储钱包私钥
     - ✅ 用户手动使用浏览器钱包（RainbowKit + wagmi）签名派生 API Key
     - ✅ API Key（`{ key, secret, passphrase }`）存储在前端（会话内存/sessionStorage）
     - ✅ 后端仅使用前端传入的预批准 API Key 执行订单，不接收私钥或生成密钥
   - **安全益处**：零私钥泄露风险，满足监管，用户完全控制

2. **Phase 2 运行模式 — 明确为交互模式，取消自主模式**
   - **P1 承诺**：
     - ✅ 仅实现**交互模式**：用户前置配置与批准，后端在预批准范围内执行
     - ✅ 用户通过前端配置网格参数（价格区间、步长、每格数量、预算、风控）并明确点击"启动"
     - ✅ 后端基于预批准的 API Key 和预算限额自动执行网格交易与补挂
     - ✅ 所有关键操作（参数变更、API Key 轮换、策略停止）需用户显式确认
   - **取消的特性**（推迟到 P3）：
     - ❌ 后端自主生成或派生密钥
     - ❌ 后端独立修改网格参数或预算限额
     - ❌ 无用户批准的自主行为
     - ❌ 后端持久化私钥或秘文

---

## 📄 生成的规范文件

### 1. **spec.md** 🎯

- **路径**：`specs/001-polymarket-grid-bot/spec.md`
- **状态**：✅ 完整且已验证
- **关键更新**：
  - FR-011：明确前端钱包签名派生 API Key，永不后端存储
  - FR-012：添加为"交互模式与运行策略"，定义 P1 仅交互模式
  - 所有 [NEEDS CLARIFICATION] 已解决
- **核心内容**：
  - 3 个用户故事（P1/P2/P3）
  - 10+ 个功能需求（FR-001 ～ FR-013）
  - 9 个关键实体模型
  - 5 个可度量的成功标准
  - 7 个识别的边界情况

### 2. **plan.md** 📐

- **路径**：`specs/001-polymarket-grid-bot/plan.md`
- **状态**：✅ 完整的实现计划
- **内容**：
  - **技术背景**：TypeScript/Next.js 16，@polymarket/clob-client，RainbowKit，shadcn/ui
  - **安全模型**：明确 P1 交互模式，前端 API Key 派生与存储，后端约束
  - **项目结构**：前端（Next.js App Router）、服务层、Worker、测试、文档
  - **Phased Plan**（Phase 0 ～ 5）：
    - **Phase 0**：Research - 确认 CLOB 能力、前端实时通道、API Key 派生、账户监控
    - **Phase 1**：Design - 数据模型、API 契约、前端设计、后端设计、账户监控
    - **Phase 2**：Implementation (P1) - **交互模式，取消自主模式**：API Key 管理、CLOB 适配、网格引擎、Worker、前端主页、钱包集成、实时数据、账户监控、持久化、日志
    - **Phase 3**：Risk & Monitoring (P2)
    - **Phase 4**：Simulation & Backtest (P3)
    - **Phase 5**：Hardening

### 3. **checklists/requirements.md** ✅

- **路径**：`specs/001-polymarket-grid-bot/checklists/requirements.md`
- **状态**：✅ 规范质量检查已通过
- **检查结果**：
  | 类别 | 状态 |
  |------|------|
  | 内容质量 | ✅ 通过 |
  | 需求完整性 | ✅ 通过 |
  | 功能完整性 | ✅ 通过 |
  | 安全设计 | ✅ 通过 |
  | **总体就绪** | **✅ 通过** |

---

## 🔐 P1 交互模式 vs 取消的自主模式

### ✅ P1 交互模式（实现）

```
用户 ──(钱包签名派生 API Key)──> 前端
                                 ↓
                        sessionStorage 存储 API Key
                                 ↓
用户 ──(配置参数 + 批准启动)──> 前端
                                 ↓
                        发送预批准参数到后端
                                 ↓
后端 ──(基于 API Key + 预算执行)──> Polymarket
                                 ↓
        (自动补挂、风控检查、日志记录)
```

**特点**：

- ✅ 用户掌控：签名、批准、参数变更、停止
- ✅ 安全：前端派生 Key，后端无私钥
- ✅ 有限自主：后端在预批准范围内自动执行，不独立决策
- ✅ 可审计：所有操作需用户确认，事件可追踪

### ❌ 自主模式（取消，推迟 P3）

```
后端 ──(生成/派生密钥)──> 数据库持久化
        ↓
后端 ──(自主生成交易决策)──> Polymarket
        ↓
后端 ──(无人值守运行)──> 完全自主，无用户控制
```

**为什么取消**：

- ❌ 私钥泄露风险高
- ❌ 监管合规性问题
- ❌ 用户控制力丧失
- ❌ 无法审计
- ❌ P1 范围太大，延缓交付

---

## 🎯 关键设计决策

### 1. **前端 API Key 派生**

- **决策**：用户在前端通过浏览器钱包签名生成 API Key
- **实现**：RainbowKit → wagmi → viem → EIP-712 签名 → SDK `deriveApiKey()`
- **存储**：会话内存或 sessionStorage（不持久化到后端）
- **生命周期**：查看、复制、吊销、重新派生

### 2. **后端约束**

- **下单**：仅使用前端传入的预批准 API Key 执行，不生成密钥
- **参数**：严格遵守用户预批准的预算限额与风控规则，不独立修改
- **决策**：不进行自主决策，仅在满足预批准条件时执行

### 3. **用户批准流程**

- **启动**：配置参数 → 显式确认框 → 点击"批准启动"
- **变更**：任何参数或 API Key 变更需前端显式确认
- **停止**：用户随时可停止策略（明确按钮）

### 4. **运行模式**

- **P1**：交互模式（仅此）
- **P2**：风控与监控
- **P3**：可选扩展（回测、纸面交易、多市场、自主模式）

---

## 📊 规范覆盖范围

### User Scenarios & Testing

- ✅ US-1：启动可配置的网格策略（P1）
- ✅ US-2：风险控制与资金保护（P2）
- ✅ US-3：模拟/纸面交易与回测（P3）

### Functional Requirements

- ✅ FR-001：市场与账户连接
- ✅ FR-002：参数配置与校验
- ✅ FR-003：初始布网与下单
- ✅ FR-004：成交监听与补挂
- ✅ FR-005：风险控制
- ✅ FR-006：手续费与滑点
- ✅ FR-007：状态持久化
- ✅ FR-008：运行监控与日志
- ✅ FR-009：模拟/回测
- ✅ FR-010：多市场扩展（可选）
- ✅ **FR-011**：认证与密钥管理（**前端派生，永不后端存储**）
- ✅ **FR-012**：交互模式与运行策略（**P1 仅交互，取消自主**）

### Success Criteria

- ✅ SC-001：启动时长 < 10s（95%）
- ✅ SC-002：7×24 稳定性，失败率 < 0.5%
- ✅ SC-003：异常恢复 < 5s，0 数据丢失
- ✅ SC-004：绩效统计 100% 准确
- ✅ SC-005：风控触发 100%，误触发 < 0.1%

---

## 🚀 后续步骤

### 立即可进行

1. **Phase 0 Research**（`/speckit.plan` 命令自动执行）

   - 确认 @polymarket/clob-client 版本与能力
   - 验证前端浏览器 CORS 兼容性
   - 确认 API Key 派生支持 EIP-712 签名
   - 研究实时数据通道（SSE vs WS）
   - **输出**：`research.md`

2. **Phase 1 Design**（规范已支撑）

   - 定义完整数据模型与状态转移
   - 设计 API 契约（REST + SSE）
   - 设计前端组件与钱包集成流程
   - 设计后端 Worker 架构
   - **输出**：`data-model.md`、`contracts/`、`quickstart.md`

3. **Phase 2 Implementation**（Phase 1 完成后）
   - 实现交互模式（前端钱包签名 → API Key 派生 → 策略启动）
   - 实现 CLOB 适配与预批准下单
   - 实现网格引擎与 Worker
   - 实现账户监控与前端页面
   - **不包含**：自主模式（永远不进 P1）

### 推荐流程

```
✅ Spec & Plan Complete
    ↓
📌 Phase 0: Research (generate research.md)
    ↓
📌 Phase 1: Design (generate data-model.md, contracts/)
    ↓
🔨 Phase 2: Implementation - P1 Interactive Mode (NO autonomous mode)
    ↓
📊 Phase 3: Risk & Monitoring (P2)
    ↓
🧪 Phase 4: Simulation & Backtest (P3)
```

---

## 📁 文件清单

| 文件            | 路径                                                       | 状态    | 用途     |
| --------------- | ---------------------------------------------------------- | ------- | -------- |
| spec.md         | `specs/001-polymarket-grid-bot/spec.md`                    | ✅ 完成 | 功能规范 |
| plan.md         | `specs/001-polymarket-grid-bot/plan.md`                    | ✅ 完成 | 实现计划 |
| requirements.md | `specs/001-polymarket-grid-bot/checklists/requirements.md` | ✅ 完成 | 质量检查 |

---

## ✨ 关键承诺确认

### 永不在后端存储私钥 ✅

- ❌ 不生成私钥
- ❌ 不派生私钥
- ❌ 不持久化私钥
- ✅ 前端用户钱包签名派生 API Key
- ✅ API Key 存储在前端会话

### P1 仅交互模式 ✅

- ✅ 用户前置配置与批准
- ✅ 后端在预批准范围内执行
- ✅ 所有关键操作需用户确认
- ❌ 无后端自主决策
- ❌ 无无人值守模式
- ❌ 无自主密钥生成

### 质量保证 ✅

- ✅ 规范通过所有质量检查
- ✅ 所有 NEEDS CLARIFICATION 已解决
- ✅ 成功标准可度量且技术无关
- ✅ 接收场景完整且可测试
- ✅ 安全设计明确且可审计

---

## 📞 联系与反馈

如需调整或澄清，请基于以下原则：

1. **安全优先**：永不在后端存储私钥
2. **用户控制**：所有关键操作需用户显式批准
3. **P1 简洁**：交互模式，推迟高级特性到 P3
4. **可观测性**：所有操作可追踪与审计

---

**生成时间**：2025-11-03  
**分支**：`001-polymarket-grid-bot`  
**状态**：✅ 规范与计划就绪，可推进 Phase 0 研究
