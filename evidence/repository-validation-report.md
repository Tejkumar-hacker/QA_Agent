# Evidence Item 1: Repository Structure & Component Inventory Report

## Inspection Date: 2026-10-05
## Scope: Full Workspace Inspection (CoreBank QA Agent)

---

## 1. Inventory of Files & Verified Paths

| Path | Component Type | Status | Description |
|---|---|---|---|
| `package.json` | Project Configuration | Verified | NPM package config, test scripts, dependencies |
| `tsconfig.json` | TypeScript Configuration | Verified | ES2022, strict mode, CommonJS compiler config |
| `playwright.config.ts` | Playwright Config | Verified | Multi-project (UI Chromium + API), JUnit & JSON reporters |
| `.env.example` | Environment Template | Verified | Safe non-prod environment placeholders |
| `requirements/fund-transfer-requirement.md` | Requirements Spec | Verified | REQ-PAY-FT-001 (12 Acceptance Criteria) |
| `config/risk-rules.json` | Risk Scoring Rules | Verified | 5-factor mathematical risk weighting formula |
| `config/environments.example.json` | Environment Config | Verified | Non-prod QA/SIT configurations with env placeholders |
| `prompts/requirement-analysis-prompt.md` | AI System Prompt | Verified | Prompt for requirement decomposition & risk scoring |
| `prompts/test-generation-prompt.md` | AI System Prompt | Verified | Prompt for multi-layer test synthesis |
| `prompts/failure-analysis-prompt.md` | AI System Prompt | Verified | Prompt for root-cause triage & defect generation |
| `schemas/transfer-api-schema.json` | JSON Schema | Verified | Draft-07 API response validation contract |
| `test-data/synthetic/synthetic-test-data.json` | Synthetic Test Data | Verified | Masked account balances, scenarios, limits |
| `pages/FundTransferPage.ts` | Playwright POM | Verified | Page Object Model with accessible role selectors |
| `tests/fund-transfer-test-catalog.md` | Test Case Catalog | Verified | 20 detailed risk-ranked test specifications |
| `tests/ui/playwright/fund-transfer.spec.ts` | Playwright UI Suite | Verified | UI E2E journey, negative validation, debounce tests |
| `tests/api/fund-transfer-api.spec.ts` | Payments API Suite | Verified | API schema validation, idempotency, boundary tests |
| `tests/legacy-ui/selenium/SeleniumBankingAdapter.ts` | Legacy UI Adapter | Verified | Selenium adapter with explicit waits and driver isolation |
| `tests/reconciliation/CoreBankReconciliationEngine.ts` | Reconciliation Engine | Verified | Double-entry ledger balance reconciler |
| `tests/reconciliation/validate-ledger.ts` | Reconciliation Unit Suite | Verified | 7 unit fixtures validating balance invariants |
| `.github/workflows/corebank-qa-agent.yml` | CI/CD Workflow | Verified | Primary GitHub Actions CI/CD workflow |
| `pipelines/azure-pipelines.yml` | CI/CD Pipeline (Legacy) | Verified | Optional reference Azure DevOps pipeline |
| `scripts/evaluate-quality-gate.ts` | Quality Gate Engine | Verified | Multi-factor risk gating with 9 unit test cases |
| `scripts/simulate-execution.ts` | Simulation Harness | Verified | Prototype execution & duplicate-debit demonstration |
| `reports/defect-DEF-FT-2026-001.md` | Defect Report | Verified | Sanitized critical duplicate debit defect report |
| `docs/architecture.md` | Solution Architecture | Verified | Architectural diagrams, layers, and data flow |
| `docs/governance.md` | Governance Policy | Verified | Safety guardrails & human-in-the-loop controls |
| `docs/traceability-matrix.md` | Traceability Matrix | Verified | 100% AC-to-Test mapping across 20 test cases |
| `docs/security-validation-report.md` | Security Audit | Verified | Secret scanning & PII masking validation |
| `docs/white-paper-outline.md` | White Paper Outline | Verified | Executive summary and structure outline |
| `README.md` | Setup & Architecture Guide | Verified | Comprehensive repository documentation |

---

## 2. Missing-File & Dependency Check
- **Missing Required Files:** None.
- **Dependency Status:** Verified and installed (TypeScript 5.4, Playwright 1.43, AJV 8.12, ts-node 10.9).
- **Security Check:** Zero exposed plaintext credentials or production endpoints.
