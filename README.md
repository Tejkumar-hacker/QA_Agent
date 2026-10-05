# CoreBank QA Agent: Setup, Architecture & Execution Guide

## Overview
**CoreBank QA Agent** is an intelligent, risk-aware QA decision-support platform designed for core banking systems. It bridges requirement analysis, risk scoring, multi-layer test generation (Playwright UI + API + Legacy Selenium), synthetic test-data creation, double-entry financial reconciliation, and continuous release gating in GitHub Actions CI/CD pipelines (with Azure DevOps retained as a legacy reference).

---

## Repository Structure
```text
corebank-qa-agent/
├── README.md                                # Setup and quickstart guide
├── package.json                             # Dependencies and test run scripts
├── tsconfig.json                            # TypeScript configuration
├── playwright.config.ts                     # Playwright multi-project runner configuration
├── requirements/
│   └── fund-transfer-requirement.md         # Sample requirement specification (REQ-PAY-FT-001)
├── prompts/
│   ├── requirement-analysis-prompt.md       # AI prompt for requirement & risk extraction
│   ├── test-generation-prompt.md            # AI prompt for multi-layer test case synthesis
│   └── failure-analysis-prompt.md           # AI prompt for root-cause triage & defect creation
├── config/
│   ├── environments.example.json            # Non-prod environment configurations (QA/SIT)
│   └── risk-rules.json                      # Risk scoring formula and weight matrix
├── schemas/
│   └── transfer-api-schema.json             # JSON Schema for payment transfer API response
├── test-data/
│   └── synthetic/
│       └── synthetic-test-data.json         # Masked synthetic accounts and test scenarios
├── pages/
│   └── FundTransferPage.ts                  # Playwright Page Object Model for transfer flow
├── tests/
│   ├── fund-transfer-test-catalog.md        # 20 Detailed risk-ranked test specifications
│   ├── ui/
│   │   └── playwright/
│   │       └── fund-transfer.spec.ts        # Playwright UI E2E test suite
│   ├── api/
│   │   └── fund-transfer-api.spec.ts        # Payments API & idempotency test suite
│   ├── legacy-ui/
│   │   └── selenium/
│   │       └── SeleniumBankingAdapter.ts    # Legacy banking portal Selenium adapter
│   └── reconciliation/
│       └── CoreBankReconciliationEngine.ts  # Double-entry ledger balance verification engine
├── .github/
│   └── workflows/
│       └── corebank-qa-agent.yml            # Primary GitHub Actions CI/CD workflow
├── pipelines/
│   └── azure-pipelines.yml                  # Legacy / reference Azure DevOps pipeline
├── scripts/
│   ├── simulate-execution.ts                # Prototype execution & reconciliation simulation
│   └── evaluate-quality-gate.ts             # Risk-weighted release gate evaluator
├── reports/
│   └── defect-DEF-FT-2026-001.md            # Sanitized sample critical defect report
└── docs/
    ├── architecture.md                      # System architecture & component design
    ├── governance.md                        # Security, guardrails & human-in-the-loop policy
    ├── traceability-matrix.md               # Requirement to test traceability matrix (RTM)
    └── white-paper-outline.md               # Executive white paper outline
```

---

## Single-Command Client Execution Workflow

Clients can evaluate synthetic banking test data (JSON or CSV) via a single command without external network dependencies, database connections, or UI browser overhead:

```bash
# Evaluate a single synthetic JSON file
npm run agent -- --input ./input/sample-pass.json

# Evaluate a duplicate-debit anomaly JSON file
npm run agent -- --input ./input/sample-duplicate-debit.json

# Evaluate a multi-row synthetic CSV batch
npm run agent -- --input ./input/sample-batch.csv

# Specify custom output directory and allow overwrite
npm run agent -- --input ./input/sample-pass.json --output ./results --overwrite
```

### Standard Exit Codes
- `0` = `PASS` (All financial invariants & safety controls satisfied)
- `1` = `PASS WITH RISK` (Non-critical advisory telemetry findings)
- `2` = `INPUT_REJECTED` (Validation error: unmasked PII, invalid structure, non-synthetic data)
- `3` = `DO NOT RELEASE` (Critical financial/security failure: duplicate debit, ledger imbalance, failed reversal)
- `4` = `INCONCLUSIVE` (Missing evidence / incomplete financial stream)
- `5` = `INTERNAL_AGENT_ERROR` (Unexpected execution failure)

---

## Quickstart & Execution

### 1. Prerequisites
- Node.js 18+ or 20+ (tested on Node v24.19.0)
- npm 9+

### 2. Installation
```bash
npm install
```

### 3. Full Project Validation
```bash
# Compile TypeScript, run reconciliation unit tests, quality gate matrix, and client engine tests
npm run validate
```

### 4. Running Test Suites
```bash
# Run all Playwright UI tests
npm run test:ui

# Run Payments API test suite
npm run test:api

# Run Critical & Smoke tests
npm run test:critical

# Run Ledger Reconciliation unit tests
npm run test:reconciliation

# Run Quality Gate evaluation harness
npm run quality-gate

# Run Client Engine unit tests (12 invariant tests)
npm run test:client
```

---

## Key Safety & Governance Principles
- **Decision Support Only:** The agent never independently approves production releases. Human CAB approval is required.
- **Zero Real Data:** Operates strictly with synthetic data.
- **Masking:** Account numbers masked as `XXXXXXXX1234` and tokens as `[REDACTED]`.
- **Financial Invariants:** Zero-tolerance for duplicate debits and general ledger imbalances.
