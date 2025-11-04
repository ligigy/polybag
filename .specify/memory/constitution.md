<!--
Sync Impact Report
Version: 0.0.0 -> 1.0.0
Modified Principles:
- (new) I. User-Governed Execution (NON-NEGOTIABLE)
- (new) II. Deterministic Strategy Lifecycle
- (new) III. Typed Market Data Contracts (NON-NEGOTIABLE)
- (new) IV. Test-First Automation
- (new) V. Telemetry & Incident Visibility
Added sections:
- Core Principles
- Platform Constraints
- Development Workflow
Removed sections:
- None
Templates requiring updates:
- .specify/templates/plan-template.md ✅ updated
- .specify/templates/spec-template.md ✅ updated
- .specify/templates/tasks-template.md ✅ updated
Follow-up TODOs:
- None
-->

# Polybag Constitution

## Core Principles

### I. User-Governed Execution (NON-NEGOTIABLE)
- The platform MUST remain non-custodial: backend services never store private keys or API credentials and MAY NOT trigger autonomous orders.
- Every irreversible market action requires explicit user approval, surfaced in the UI or signed requests, and MUST document the initiating actor.
These safeguards preserve user control and limit operational blast radius.

### II. Deterministic Strategy Lifecycle
- Strategy changes MUST originate from an approved spec and plan, capturing entry/exit conditions, budget limits, and rollback procedures.
- Deployments MAY proceed only after documenting the impact in `specs/` and confirming that implementations match the committed plan.
This ensures strategies are reviewable, reproducible, and auditable.

### III. Typed Market Data Contracts (NON-NEGOTIABLE)
- Key market data structures (order books, trades, balances, grid layers) MUST be expressed with explicit TypeScript types or JSON schemas enforced at compile time and runtime.
- Any schema change requires documenting compatibility expectations and updating corresponding validators, normalizers, and downstream consumers.
Type constraints prevent silent data drift and satisfy the requirement that critical structures stay type-safe (`对于关键的数据结构, 一定要使用类型约束`).

### IV. Test-First Automation
- New behavior MUST ship with failing tests (unit, integration, or contract) before implementation; automated checks MUST cover happy path and edge risk scenarios.
- No production change may merge while tests fail or lack deterministic assertions for the affected strategy pathway.
Disciplined testing keeps automated trading predictable and reviewable.

### V. Telemetry & Incident Visibility
- Real-time services MUST emit structured logs, metrics, and health indicators sufficient to trace market actions, WebSocket state, and worker heartbeats.
- Critical incidents (reconnect storms, slippage breaches, budget overruns) MUST raise alerts and be cataloged with remediation steps.
Observability ensures timely detection and response across live market operations.

## Platform Constraints

- Production environments MUST run on Node.js ≥ 18 with vetted dependencies; experimental packages require documented risk assessment.
- Secrets reside in user-controlled storage or secure vault integrations; `.env` files checked into source control are prohibited.
- External connectivity to Polymarket endpoints MUST respect documented rate limits and throttle policies.

## Development Workflow

- Feature work follows the `spec → plan → tasks → implementation` sequence, updating `/specs/001-polymarket-grid-bot/` artifacts before code.
- Reviews MUST verify alignment with this constitution, including type contracts, tests, and telemetry instrumentation.
- Migrations or infrastructure shifts require rollback instructions and validation steps recorded alongside the change.

## Governance

- This constitution supersedes conflicting guidelines; amendments require consensus of project maintainers, documented rationale, and updated templates/checklists.
- Versioning follows semantic rules: MAJOR for breaking changes to principles/governance, MINOR for new principles or sections, PATCH for clarifications.
- Compliance reviews occur at each release milestone; non-conformant work items MUST not ship until remediated or formally waived with risk documentation.

**Version**: 1.0.0 | **Ratified**: 2025-11-04 | **Last Amended**: 2025-11-04
